/* eslint-disable max-params */
import { BaseTelegramClient, MtTypeAssertionError, tl } from '@mtcute/core'

import { Message } from '../../types/messages/index.js'
import { PeersIndex } from '../../types/peers/index.js'
import { assertIsUpdatesGroup } from '../../utils/updates-utils.js'

/**
 * @internal
 * @noemit
 */
export function _findMessageInUpdate(
    client: BaseTelegramClient,
    res: tl.TypeUpdates,
    isEdit?: boolean,
    noDispatch?: boolean,
    allowNull?: false,
): Message
/**
 * @internal
 * @noemit
 */
export function _findMessageInUpdate(
    client: BaseTelegramClient,
    res: tl.TypeUpdates,
    isEdit?: boolean,
    noDispatch?: boolean,
    allowNull?: true,
): Message | null

/**
 * @internal
 * @noemit
 */
export function _findMessageInUpdate(
    client: BaseTelegramClient,
    res: tl.TypeUpdates,
    isEdit = false,
    noDispatch = true,
    allowNull = false,
): Message | null {
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

    if (allowNull) return null

    throw new MtTypeAssertionError(
        '_findInUpdate (@ .updates[*])',
        'updateNewMessage | updateNewChannelMessage | updateNewScheduledMessage',
        'none',
    )
}
