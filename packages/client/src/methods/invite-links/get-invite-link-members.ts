import { TelegramClient } from '../../client'
import { ChatInviteLink, InputPeerLike, User } from '../../types'
import { createUsersChatsIndex } from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'

/**
 * Iterate over users who have joined
 * the chat with the given invite link.
 *
 * @param chatId  Chat ID
 * @param link  Invite link
 * @param limit  Maximum number of users to return (by default returns all)
 * @internal
 */
export async function* getInviteLinkMembers(
    this: TelegramClient,
    chatId: InputPeerLike,
    link: string,
    limit = Infinity
): AsyncIterableIterator<ChatInviteLink.JoinedMember> {
    const peer = await this.resolvePeer(chatId)

    let current = 0

    let offsetDate = 0
    let offsetUser: tl.TypeInputUser = { _: 'inputUserEmpty' }

    for (;;) {
        // for some reason ts needs annotation, idk
        const res: tl.RpcCallReturn['messages.getChatInviteImporters'] = await this.call(
            {
                _: 'messages.getChatInviteImporters',
                limit: Math.min(100, limit - current),
                peer,
                link,
                offsetDate,
                offsetUser,
            }
        )

        if (!res.importers.length) break

        const { users } = createUsersChatsIndex(res)

        const last = res.importers[res.importers.length - 1]
        offsetDate = last.date
        offsetUser = {
            _: 'inputUser',
            userId: last.userId,
            accessHash: (users[last.userId] as tl.RawUser).accessHash!,
        }

        for (const it of res.importers) {
            const user = new User(this, users[it.userId])

            yield {
                user,
                date: new Date(it.date * 1000),
            }
        }

        current += res.importers.length
        if (current >= limit) break
    }
}
