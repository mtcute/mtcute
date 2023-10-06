import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { ArrayPaginated, ChatInviteLinkMember, InputPeerLike, PeersIndex } from '../../types'
import { makeArrayPaginated, normalizeDate, normalizeToInputUser } from '../../utils'

/**
 * Iterate over users who have joined
 * the chat with the given invite link.
 *
 * @param chatId  Chat ID
 * @param params  Additional params
 * @internal
 */
export async function getInviteLinkMembers(
    this: TelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Invite link for which to get members
         */
        link?: string

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
    const peer = await this.resolvePeer(chatId)
    if (!params) params = {}

    const { limit = 100, link, requestedSearch, requested = Boolean(requestedSearch) } = params

    const { offsetUser = { _: 'inputUserEmpty' } } = params

    const offsetDate = normalizeDate(params.offsetDate) ?? 0

    const res = await this.call({
        _: 'messages.getChatInviteImporters',
        limit,
        peer,
        link,
        requested,
        q: requestedSearch,
        offsetDate,
        offsetUser,
    })

    const peers = PeersIndex.from(res)

    const members = res.importers.map((it) => new ChatInviteLinkMember(this, it, peers))

    const last = members[members.length - 1]
    const nextOffset = last ?
        {
            date: last.raw.date,
            user: normalizeToInputUser(last.user.inputPeer),
        } :
        undefined

    return makeArrayPaginated(members, res.count, nextOffset)
}
