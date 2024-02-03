import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { ArrayPaginated, ChatInviteLink, ChatInviteLinkMember, InputPeerLike, PeersIndex } from '../../types/index.js'
import { makeArrayPaginated, normalizeDate, toInputUser } from '../../utils/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Iterate over users who have joined
 * the chat with the given invite link.
 *
 * @param chatId  Chat ID
 * @param params  Additional params
 */
export async function getInviteLinkMembers(
    client: ITelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Invite link for which to get members
         */
        link?: string | ChatInviteLink

        /**
         * Maximum number of users to return
         *
         * @default  100
         */
        limit?: number

        /**
         * Offset request/join date used as an anchor for pagination.
         */
        offsetDate?: Date | number

        /**
         * Offset user used as an anchor for pagination
         */
        offsetUser?: tl.TypeInputUser

        /**
         * Whether to get users who have requested to join
         * the chat but weren't accepted yet
         */
        requested?: boolean

        /**
         * Search for a user in the pending join requests list
         * (if passed, {@link requested} is assumed to be true)
         *
         * Doesn't work when {@link link} is set (Telegram limitation)
         */
        requestedSearch?: string
    },
): Promise<ArrayPaginated<ChatInviteLinkMember, { date: number; user: tl.TypeInputUser }>> {
    const peer = await resolvePeer(client, chatId)
    if (!params) params = {}

    const { limit = 100, link, requestedSearch, requested = Boolean(requestedSearch) } = params

    const { offsetUser = { _: 'inputUserEmpty' } } = params

    const offsetDate = normalizeDate(params.offsetDate) ?? 0

    const res = await client.call({
        _: 'messages.getChatInviteImporters',
        limit,
        peer,
        link: typeof link === 'string' ? link : link?.link,
        requested,
        q: requestedSearch,
        offsetDate,
        offsetUser,
    })

    const peers = PeersIndex.from(res)

    const members = res.importers.map((it) => new ChatInviteLinkMember(it, peers))

    const last = members[members.length - 1]
    const nextOffset = last ?
        {
            date: last.raw.date,
            user: toInputUser(last.user.inputPeer),
        } :
        undefined

    return makeArrayPaginated(members, res.count, nextOffset)
}
