import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { ChatInviteLinkJoinedMember, InputPeerLike, PeersIndex, User } from '../../types'

/**
 * Iterate over users who have joined
 * the chat with the given invite link.
 *
 * @param chatId  Chat ID
 * @param params  Additional params
 * @internal
 */
export async function* getInviteLinkMembers(
    this: TelegramClient,
    chatId: InputPeerLike,
    params: {
        /**
         * Invite link for which to get members
         */
        link?: string

        /**
         * Maximum number of users to return (by default returns all)
         */
        limit?: number

        /**
         * Whether to get users who have requested to join
         * the chat but weren't accepted yet
         */
        requested?: boolean

        /**
         * Search for a user in the pending join requests list
         * (only works if {@link requested} is true)
         *
         * Doesn't work when {@link link} is set (Telegram limitation)
         */
        requestedSearch?: string
    },
): AsyncIterableIterator<ChatInviteLinkJoinedMember> {
    const peer = await this.resolvePeer(chatId)

    const limit = params.limit ?? Infinity
    let current = 0

    let offsetDate = 0
    let offsetUser: tl.TypeInputUser = { _: 'inputUserEmpty' }

    for (;;) {
        // for some reason ts needs annotation, idk
        const res: tl.RpcCallReturn['messages.getChatInviteImporters'] =
            await this.call({
                _: 'messages.getChatInviteImporters',
                limit: Math.min(100, limit - current),
                peer,
                link: params.link,
                requested: params.requested,
                q: params.requestedSearch,
                offsetDate,
                offsetUser,
            })

        if (!res.importers.length) break

        const peers = PeersIndex.from(res)

        const last = res.importers[res.importers.length - 1]
        offsetDate = last.date
        offsetUser = {
            _: 'inputUser',
            userId: last.userId,
            accessHash: (peers.user(last.userId) as tl.RawUser).accessHash!,
        }

        for (const it of res.importers) {
            const user = new User(this, peers.user(it.userId))

            yield {
                user,
                date: new Date(it.date * 1000),
                isPendingRequest: it.requested!,
                bio: it.about,
                approvedBy: it.approvedBy,
            }
        }

        current += res.importers.length
        if (current >= limit) break
    }
}
