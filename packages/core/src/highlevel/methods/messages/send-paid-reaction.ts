import type { ITelegramClient } from '../../client.types.js'

import type {
  InputMessageId,
  InputPeerLike,
} from '../../types/index.js'
import { tl } from '@mtcute/tl'
import { MtcuteError } from '../../../types/errors.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import {
  MessageReactions,

  normalizeInputMessageId,
  PeersIndex,
} from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=user
/**
 * Send a paid reaction using Telegram Stars.
 *
 * @returns
 *   Message to which the reaction was sent, if available.
 *   The message is normally available for users, but may not be available for bots in PMs.
 */
export async function sendPaidReaction(
  client: ITelegramClient,
  params: InputMessageId & {
    /**
     * Whether to send the reaction anonymously
     */
    anonymous?: boolean

    /**
     * Peer as which to send the reaction, mutually exclusive with `anonymous`
     */
    asPeer?: InputPeerLike

    /**
     * Number of reactions to send
     *
     * @default  1
     */
    count?: number

    /**
     * Whether to dispatch the returned edit message event
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<MessageReactions> {
  const { anonymous, asPeer, count = 1 } = params
  const { chatId, message } = normalizeInputMessageId(params)

  const peer = await resolvePeer(client, chatId)

  let privacy: tl.TypePaidReactionPrivacy | undefined
  if (anonymous !== undefined) {
    privacy = { _: anonymous ? 'paidReactionPrivacyAnonymous' : 'paidReactionPrivacyDefault' }
  } else if (asPeer) {
    privacy = { _: 'paidReactionPrivacyPeer', peer: await resolvePeer(client, asPeer) }
  }

  let res

  for (let i = 0; i < 3; i++) {
    try {
      res = await client.call({
        _: 'messages.sendPaidReaction',
        peer,
        msgId: message,
        count,
        private: privacy,
        randomId: await client.getMtprotoMessageId(),
      })
      break
    } catch (e) {
      if (tl.RpcError.is(e, 'RANDOM_ID_EXPIRED')) {
        // just retry, mtproto message id may have been stale
        continue
      }

      throw e
    }
  }

  if (!res) {
    throw new MtcuteError('Could not send paid reaction')
  }

  assertIsUpdatesGroup('messages.sendReaction', res)

  // normally the group only contains updateMessageReactions

  const peers = PeersIndex.from(res)
  const upd = res.updates[0]

  assertTypeIs('messages.sendPaidReaction (@ .updates[0])', upd, 'updateMessageReactions')

  return new MessageReactions(upd.msgId, getMarkedPeerId(upd.peer), upd.reactions, peers)
}
