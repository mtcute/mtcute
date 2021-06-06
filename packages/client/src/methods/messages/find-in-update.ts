import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { Message, MtCuteTypeAssertionError } from '../../types'
import { createUsersChatsIndex } from '../../utils/peer-utils'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/** @internal */
export function _findMessageInUpdate(
    this: TelegramClient,
    res: tl.TypeUpdates,
    isEdit = false
): Message {
    assertIsUpdatesGroup('_findMessageInUpdate', res)

    this._handleUpdate(res, true)

    for (const u of res.updates) {
        if (
            (isEdit &&
                (u._ === 'updateEditMessage' ||
                    u._ === 'updateEditChannelMessage')) ||
            (!isEdit &&
                (u._ === 'updateNewMessage' ||
                    u._ === 'updateNewChannelMessage' ||
                    u._ === 'updateNewScheduledMessage'))
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
        '_findInUpdate (@ .updates[*])',
        'updateNewMessage | updateNewChannelMessage | updateNewScheduledMessage',
        'none'
    )
}
