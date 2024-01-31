import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../../types/errors.js'
import { isPresent } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { Message } from '../../types/messages/message.js'
import { InputPeerLike } from '../../types/peers/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getMessages } from './get-messages.js'
import { CommonSendParams } from './send-common.js'
import { sendMediaGroup } from './send-media-group.js'

// @exported
export interface SendCopyGroupParams extends CommonSendParams {
    /** Destination chat ID */
    toChatId: InputPeerLike
}

/**
 * Copy a message group (i.e. send the same message group, but do not forward it).
 *
 * Note that all the provided messages must be in the same message group
 */
export async function sendCopyGroup(
    client: ITelegramClient,
    params: SendCopyGroupParams &
        (
            | {
                  /** Source chat ID */
                  fromChatId: InputPeerLike
                  /** Message IDs to forward */
                  messages: number[]
              }
            | { messages: Message[] }
        ),
): Promise<Message[]> {
    const { toChatId, ...rest } = params

    let msgs

    if ('fromChatId' in params) {
        const fromPeer = await resolvePeer(client, params.fromChatId)

        msgs = await getMessages(client, fromPeer, params.messages).then((r) => r.filter(isPresent))
    } else {
        msgs = params.messages
    }

    const messageGroupId = msgs[0].groupedId!

    for (let i = 1; i < msgs.length; i++) {
        if (!msgs[i].groupedId?.eq(messageGroupId) || !msgs[i].media) {
            throw new MtArgumentError('All messages must be in the same message group')
        }
    }

    return sendMediaGroup(
        client,
        toChatId,
        msgs.map((msg) => {
            const raw = msg.raw as tl.RawMessage

            return {
                type: 'auto',
                file: msg.media!.inputMedia,
                caption: raw.message,
                entities: raw.entities,
            }
        }),
        rest,
    )
}
