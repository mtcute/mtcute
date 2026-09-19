import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import type { InputSuggestedPost } from './_normalize-suggested-post.js'
import { MtArgumentError } from '../../../types/errors.js'
import { randomLong } from '../../../utils/long-utils.js'
import { Message, PeersIndex } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { normalizeDate } from '../../utils/misc-utils.js'

import { resolvePeer } from '../users/resolve-peer.js'
import { _normalizeInputSuggestedPost } from './_normalize-suggested-post.js'
import { _normalizeQuickReplyShortcut } from './send-common.js'
import { _getTypingTimerId } from './set-typing.js'

// @exported
export interface ForwardMessageOptions {
  /** Destination chat ID, username, phone, `"me"` or `"self"` */
  toChatId: InputPeerLike

  /** When forwarding to forums, ID of the thread to forward to */
  toThreadId?: number

  /**
   * When forwarding to a monoforum you are an admin of,
   * you **must** pass an ID of a peer you are sending the message to.
   */
  toMonoforumPeer?: InputPeerLike

  /**
   * Whether to forward silently (also applies to caption message).
   */
  silent?: boolean

  /**
   * If set, the forwarding will be scheduled to this date
   * (also applies to caption message).
   * When passing a number, a UNIX time in ms is expected.
   *
   * You can also pass `0x7FFFFFFE`, this will send the message
   * once the peer is online
   */
  schedule?: Date | number

  /**
   * Period (in seconds) after which a scheduled message will be sent again.
   * Only used together with {@link schedule} when forwarding a single message,
   * requires Telegram Premium.
   *
   * Must be one of `86400`, `7 * 86400`, `14 * 86400`, `30 * 86400`,
   * `91 * 86400`, `182 * 86400`, `365 * 86400` (or additionally `60`, `300` on test servers)
   */
  scheduleRepeatPeriod?: number

  /**
   * Whether to clear draft after sending this message (only used for caption)
   *
   * @default  `false`
   */
  clearDraft?: boolean

  /**
   * Whether to forward without author
   */
  noAuthor?: boolean

  /**
   * Whether to forward without caption (implies {@link noAuthor})
   */
  noCaption?: boolean

  /**
   * Whether to disallow further forwards of this message.
   *
   * Only for bots, works even if the target chat does not
   * have content protection.
   */
  forbidForwards?: boolean

  /**
   * Peer to use when sending the message.
   */
  sendAs?: InputPeerLike

  /**
   * If passed, instead of sending the message, it will be saved into the
   * given quick reply shortcut (either its ID or its shortcut string).
   */
  quickReply?: number | string

  /**
   * Whether to dispatch the forwarded messages
   * to the client's update handler.
   */
  shouldDispatch?: true

  /**
   * Bots only: if set, allows sending up to 1000 messages per second,
   * ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message.
   * The Stars will be withdrawn from the bot's balance.
   */
  allowPaidFloodskip?: boolean

  /**
   * Whether to allow payment for messages.
   * If set, the value represents the maximum number of stars to be paid
   */
  allowPaidMessages?: tl.Long

  /** Video timestamp to use for the forwarded video */
  videoTimestamp?: number

  /** Whether the messages being forwarded are ephemeral messages */
  fromEphemeral?: boolean

  /**
   * ID of a message effect to use when forwarding a single message to a private chat
   * (see {@link TelegramClient.getAvailableMessageEffects})
   */
  effect?: tl.Long

  /**
   * When forwarding to a channel direct messages chat, information about
   * the post suggested to the channel
   */
  suggestedPost?: InputSuggestedPost
}

/**
 * Forward one or more messages by their IDs.
 * You can forward no more than 100 messages at once.
 *
 * @param toChatId  Destination chat ID, username, phone, `"me"` or `"self"`
 * @param fromChatId  Source chat ID, username, phone, `"me"` or `"self"`
 * @param messages  Message IDs
 * @param params  Additional sending parameters
 * @returns  Newly sent, forwarded messages in the destination chat.
 */
export async function forwardMessagesById(
  client: ITelegramClient,
  params: ForwardMessageOptions & {
    /** Source chat ID, username, phone, `"me"` or `"self"` */
    fromChatId: InputPeerLike
    /** Message IDs to forward */
    messages: number[]
  },
): Promise<Message[]> {
  const {
    messages,
    toChatId,
    fromChatId,
    silent,
    schedule,
    forbidForwards,
    sendAs,
    noAuthor,
    noCaption,
    allowPaidFloodskip,
    videoTimestamp,
    toThreadId,
    toMonoforumPeer,
  } = params

  // sending more than 100 will not result in a server-sent
  // error, instead only first 100 IDs will be forwarded,
  // which is definitely not the best outcome.
  if (messages.length > 100) {
    throw new MtArgumentError('You can forward no more than 100 messages at once')
  }

  const toPeer = await resolvePeer(client, toChatId)

  await client.timers.cancel(_getTypingTimerId(toPeer))

  const res = await client.call({
    _: 'messages.forwardMessages',
    toPeer,
    fromPeer: await resolvePeer(client, fromChatId),
    id: messages,
    silent,
    scheduleDate: normalizeDate(schedule),
    randomId: Array.from({ length: messages.length }, () => randomLong()),
    dropAuthor: noAuthor,
    dropMediaCaptions: noCaption,
    noforwards: forbidForwards,
    sendAs: sendAs ? await resolvePeer(client, sendAs) : undefined,
    quickReplyShortcut: _normalizeQuickReplyShortcut(params.quickReply),
    allowPaidFloodskip,
    videoTimestamp,
    allowPaidStars: params.allowPaidMessages,
    fromEphemeral: params.fromEphemeral,
    effect: params.effect,
    suggestedPost: _normalizeInputSuggestedPost(params.suggestedPost),
    scheduleRepeatPeriod: params.scheduleRepeatPeriod,
    topMsgId: toThreadId,
    replyTo: toMonoforumPeer
      ? {
          _: 'inputReplyToMonoForum',
          monoforumPeerId: await resolvePeer(client, toMonoforumPeer),
        }
      : undefined,
  })

  assertIsUpdatesGroup(res)

  client.handleClientUpdate(res, !params.shouldDispatch)

  const peers = PeersIndex.from(res)

  const forwarded: Message[] = []
  res.updates.forEach((upd) => {
    switch (upd._) {
      case 'updateNewMessage':
      case 'updateNewChannelMessage':
      case 'updateNewScheduledMessage':
        forwarded.push(new Message(upd.message, peers, upd._ === 'updateNewScheduledMessage'))
        break
    }
  })

  return forwarded
}

/**
 * Forward one or more {@link Message}s to another chat.
 *
 * > **Note**: all messages must be from the same chat.
 */
export async function forwardMessages(
  client: ITelegramClient,
  params: ForwardMessageOptions & {
    messages: Message[]
  },
): Promise<Message[]> {
  const { messages, ...rest } = params

  return forwardMessagesById(client, {
    ...rest,
    fromChatId: messages[0].chat.inputPeer,
    messages: messages.map(it => it.id),
  })
}
