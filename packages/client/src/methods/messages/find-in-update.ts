import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { Message, MtCuteTypeAssertionError } from '../../types'
import { createUsersChatsIndex } from '../../utils/peer-utils'

/** @internal */
export function _findMessageInUpdate(
    this: TelegramClient,
    res: tl.TypeUpdates,
    isEdit = false
): Message {
    if (!(res._ === 'updates' || res._ === 'updatesCombined'))
        throw new MtCuteTypeAssertionError(
            '_findMessageInUpdate',
            'updates | updatesCombined',
            res._
        )

    for (const u of res.updates) {
        if (
            isEdit && (
                u._ === 'updateEditMessage' ||
                u._ === 'updateEditChannelMessage'
            ) || !isEdit && (
                u._ === 'updateNewMessage' ||
                u._ === 'updateNewChannelMessage' ||
                u._ === 'updateNewScheduledMessage'
            )
        ) {
            const { users, chats } = createUsersChatsIndex(res)

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
