import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { Message, MtCuteTypeAssertionError } from '../../types'

/** @internal */
export function _findMessageInUpdate(
    this: TelegramClient,
    res: tl.TypeUpdates
): Message {
    if (!(res._ === 'updates' || res._ === 'updatesCombined'))
        throw new MtCuteTypeAssertionError(
            '_findMessageInUpdate',
            'updates | updatesCombined',
            res._
        )

    for (const u of res.updates) {
        if (
            u._ === 'updateNewMessage' ||
            u._ === 'updateNewChannelMessage' ||
            u._ === 'updateNewScheduledMessage'
        ) {
            const users: Record<number, tl.TypeUser> = {}
            const chats: Record<number, tl.TypeChat> = {}
            res.users.forEach((e) => (users[e.id] = e))
            res.chats.forEach((e) => (chats[e.id] = e))

            return new Message(
                this,
                u.message,
                users,
                chats,
                u._ === 'updateNewScheduledMessage'
            )
        }
    }

    throw new MtCuteTypeAssertionError(
        '_findMessageInUpdate (@ -> updates[*])',
        'updateNewMessage | updateNewChannelMessage | updateNewScheduledMessage',
        'none'
    )
}
