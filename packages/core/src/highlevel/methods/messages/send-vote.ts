import type { MaybeArray } from '../../../types/utils.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputMessageId } from '../../types/index.js'
import { MtArgumentError } from '../../../types/errors.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { MtMessageNotFoundError, normalizeInputMessageId, Poll } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

import { _findPollInUpdate } from './find-poll-in-update.js'
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

  let poll: Poll | undefined

  if (options.some(it => typeof it === 'number')) {
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
        const answer = poll!.raw.answers[opt]
        assertTypeIsNot(answer, 'inputPollAnswer')
        return answer.option
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

  return _findPollInUpdate(client, res, true, poll)
}
