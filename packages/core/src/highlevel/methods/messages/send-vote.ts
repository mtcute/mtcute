import { MtArgumentError, MtTypeAssertionError } from '../../../types/errors.js'
import { MaybeArray } from '../../../types/utils.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputMessageId, MtMessageNotFoundError, normalizeInputMessageId, PeersIndex, Poll } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { getMessages } from './get-messages.js'

/**
 * Send or retract a vote in a poll.
 */
export async function sendVote(
    client: ITelegramClient,
    params: InputMessageId & {
        /**
         * Selected options, or `null` to retract.
         * You can pass indexes of the answers or the `Buffer`s
         * representing them. In case of indexes, the poll will first
         * be requested from the server.
         */
        options: null | MaybeArray<number | Uint8Array>
    },
): Promise<Poll> {
    const { chatId, message } = normalizeInputMessageId(params)
    let { options } = params

    if (options === null) options = []
    if (!Array.isArray(options)) options = [options]

    const peer = await resolvePeer(client, chatId)

    let poll: Poll | undefined = undefined

    if (options.some((it) => typeof it === 'number')) {
        const [msg] = await getMessages(client, peer, message)

        if (!msg) {
            throw new MtMessageNotFoundError(getMarkedPeerId(peer), message, 'to vote in')
        }

        if (!(msg.media instanceof Poll)) {
            throw new MtArgumentError('This message does not contain a poll')
        }

        poll = msg.media
        options = options.map((opt) => {
            if (typeof opt === 'number') {
                return poll!.raw.answers[opt].option
            }

            return opt
        })
    }

    const res = await client.call({
        _: 'messages.sendVote',
        peer,
        msgId: message,
        options: options as Uint8Array[],
    })

    assertIsUpdatesGroup('messages.sendVote', res)

    client.handleClientUpdate(res, true)

    const upd = res.updates[0]
    assertTypeIs('messages.sendVote (@ .updates[0])', upd, 'updateMessagePoll')

    if (!upd.poll) {
        throw new MtTypeAssertionError('messages.sendVote (@ .updates[0].poll)', 'poll', 'undefined')
    }

    const peers = PeersIndex.from(res)

    return new Poll(upd.poll, peers, upd.results)
}
