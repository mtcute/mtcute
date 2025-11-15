import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/peers/peer.js'
import type { TypingStatus } from '../../types/peers/typing-status.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

import { _maybeInvokeWithBusinessConnection } from './_business-connection.js'
import { _mapTypingStatus } from './send-typing.js'

export function _getTypingTimerId(peer: tl.TypeInputPeer, businessId?: string): string {
  let base = `typing:${peer._ === 'inputPeerSelf' ? 'self' : getMarkedPeerId(peer)}`
  if (businessId) base += `:b${businessId}`

  return base
}

const TIMER_INTERVAL = 5_000 // 5 seconds

/**
 * Sets whether a user is typing in a specific chat
 *
 * This status is automatically renewed by mtcute until a further
 * call with `cancel` is made, or a message is sent to the chat.
 */
export async function setTyping(
  client: ITelegramClient,
  params: {
    /** Chat ID where the user is currently typing */
    peerId: InputPeerLike

    /**
     * Typing status to send
     *
     * @default  `typing`
     */
    status?: Exclude<TypingStatus, 'interaction' | 'interaction_seen'> | tl.TypeSendMessageAction

    /**
     * For `upload_*` and history import actions, progress of the upload
     */
    progress?: number

    /**
     * Unique identifier of the business connection on behalf of which the action will be sent
     */
    businessConnectionId?: string

    /**
     * For comment threads, ID of the thread (i.e. top message)
     */
    threadId?: number
  },
): Promise<void> {
  const {
    peerId,
    businessConnectionId,
    threadId,
  } = params

  let status = params.status ?? 'typing'
  if (typeof status === 'string') status = _mapTypingStatus(status)

  const peer = await resolvePeer(client, peerId)
  const timerId = _getTypingTimerId(peer, businessConnectionId)

  if (client.timers.exists(timerId)) {
    client.timers.cancel(timerId)
  }

  if (status._ === 'sendMessageCancelAction') {
    await client.call({
      _: 'messages.setTyping',
      peer,
      action: status,
      topMsgId: threadId,
    })

    return
  }

  client.timers.create(timerId, async (abortSignal) => {
    await _maybeInvokeWithBusinessConnection(client, params?.businessConnectionId, {
      _: 'messages.setTyping',
      peer,
      action: status,
      topMsgId: threadId,
    }, { abortSignal })
  }, TIMER_INTERVAL, true)
}
