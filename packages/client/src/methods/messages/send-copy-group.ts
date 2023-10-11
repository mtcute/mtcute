import { BaseTelegramClient, MtArgumentError, tl } from '@mtcute/core'
import { isPresent } from '@mtcute/core/utils'

import { Message } from '../../types/messages/message'
import { InputPeerLike } from '../../types/peers'
import { resolvePeer } from '../users/resolve-peer'
import { getMessages } from './get-messages'
import { CommonSendParams } from './send-common'
import { sendMediaGroup } from './send-media-group'

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
    client: BaseTelegramClient,
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
