import { BaseTelegramClient, MtTypeAssertionError, tl } from '@mtcute/core'

import { Message } from '../../types/messages'
import { PeersIndex } from '../../types/peers'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/** @internal */
export function _findMessageInUpdate(
    client: BaseTelegramClient,
    res: tl.TypeUpdates,
    isEdit = false,
    noDispatch = true,
): Message {
    assertIsUpdatesGroup('_findMessageInUpdate', res)

    client.network.handleUpdate(res, noDispatch)

    for (const u of res.updates) {
        if (
            (isEdit && (u._ === 'updateEditMessage' || u._ === 'updateEditChannelMessage')) ||
            (!isEdit &&
                (u._ === 'updateNewMessage' ||
                    u._ === 'updateNewChannelMessage' ||
                    u._ === 'updateNewScheduledMessage'))
        ) {
            const peers = PeersIndex.from(res)

            return new Message(u.message, peers, u._ === 'updateNewScheduledMessage')
        }
    }

    throw new MtTypeAssertionError(
        '_findInUpdate (@ .updates[*])',
        'updateNewMessage | updateNewChannelMessage | updateNewScheduledMessage',
        'none',
    )
}
