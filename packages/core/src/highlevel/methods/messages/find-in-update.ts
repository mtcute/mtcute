/* eslint-disable max-params,no-lonely-if */
import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { ITelegramClient } from '../../client.types.js'
import { Message } from '../../types/messages/index.js'
import { PeersIndex } from '../../types/peers/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'

/**
 * @internal
 * @noemit
 */
export function _findMessageInUpdate(
    client: ITelegramClient,
    res: tl.TypeUpdates,
    isEdit?: boolean,
    noDispatch?: boolean,
    allowNull?: false,
    randomId?: tl.Long,
): Message
/**
 * @internal
 * @noemit
 */
export function _findMessageInUpdate(
    client: ITelegramClient,
    res: tl.TypeUpdates,
    isEdit?: boolean,
    noDispatch?: boolean,
    allowNull?: true,
    randomId?: tl.Long,
): Message | null

/**
 * @internal
 * @noemit
 */
export function _findMessageInUpdate(
    client: ITelegramClient,
    res: tl.TypeUpdates,
    isEdit = false,
    noDispatch = true,
    allowNull = false,
    randomId?: tl.Long,
): Message | null {
    assertIsUpdatesGroup('_findMessageInUpdate', res)

    client.handleClientUpdate(res, noDispatch)

    let ourMessageId = 0

    for (const u of res.updates) {
        if (randomId && u._ === 'updateMessageID' && u.randomId.eq(randomId)) {
            ourMessageId = u.id
            continue
        }

        if (isEdit) {
            if (
                !(
                    (
                        u._ === 'updateEditMessage' ||
                        u._ === 'updateEditChannelMessage' ||
                        u._ === 'updateBotEditBusinessMessage' ||
                        u._ === 'updateBotNewBusinessMessage'
                    ) // for whatever reason
                )
            ) {
                continue
            }
        } else {
            if (
                !(
                    u._ === 'updateNewMessage' ||
                    u._ === 'updateNewChannelMessage' ||
                    u._ === 'updateNewScheduledMessage' ||
                    u._ === 'updateQuickReplyMessage' ||
                    u._ === 'updateBotNewBusinessMessage'
                )
            ) {
                continue
            }
        }

        // this *may* break if updateMessageID comes after the message update
        // but it's unlikely and is not worth the effort to fix
        // we should eventually move to properly handling updateMessageID
        if (ourMessageId !== 0 && u.message.id !== ourMessageId) continue

        const peers = PeersIndex.from(res)

        return new Message(u.message, peers, u._ === 'updateNewScheduledMessage')
    }

    if (allowNull) return null

    throw new MtTypeAssertionError(
        '_findInUpdate (@ .updates[*])',
        'updateNewMessage | updateNewChannelMessage | updateNewScheduledMessage',
        'none',
    )
}
