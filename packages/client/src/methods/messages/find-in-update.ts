import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { Message, MtTypeAssertionError, PeersIndex } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/** @internal */
export function _findMessageInUpdate(
    this: TelegramClient,
    res: tl.TypeUpdates,
    isEdit = false,
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
            const peers = PeersIndex.from(res)

            return new Message(
                this,
                u.message,
                peers,
                u._ === 'updateNewScheduledMessage',
            )
        }
    }

    throw new MtTypeAssertionError(
        '_findInUpdate (@ .updates[*])',
        'updateNewMessage | updateNewChannelMessage | updateNewScheduledMessage',
        'none',
    )
}
