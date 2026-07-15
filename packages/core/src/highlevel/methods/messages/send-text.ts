import type Long from 'long'

import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { ReplyMarkup } from '../../types/bots/keyboards/index.js'
import type { InputText } from '../../types/misc/entities.js'
import type { InputPeerLike } from '../../types/peers/index.js'
import type { CommonSendParams } from './send-common.js'
import { MtTypeAssertionError } from '../../../types/errors.js'
import { randomLong } from '../../../utils/long-utils.js'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { BotKeyboard } from '../../types/bots/keyboards/index.js'
import { Message } from '../../types/messages/message.js'
import { PeersIndex } from '../../types/peers/index.js'
import { createDummyUpdate } from '../../updates/utils.js'
import { inputPeerToPeer } from '../../utils/peer-utils.js'
import { _getRawPeerBatched } from '../chats/batched-queries.js'

import { _normalizeInputText } from '../misc/normalize-text.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _findMessageInUpdate } from './find-in-update.js'
import { _processCommonSendParameters } from './send-common.js'

function _inputReplyToToHeader(
  replyTo: tl.TypeInputReplyTo | undefined,
  peer: tl.TypeInputPeer,
): [tl.TypeMessageReplyHeader | undefined, tl.TypePeer | undefined] {
  if (!replyTo) return [undefined, undefined]

  switch (replyTo._) {
    case 'inputReplyToMessage': {
      const replyToPeerId
        = replyTo.replyToPeerId && getMarkedPeerId(replyTo.replyToPeerId) !== getMarkedPeerId(peer)
          ? inputPeerToPeer(replyTo.replyToPeerId)
          : undefined

      return [
        {
          _: 'messageReplyHeader',
          replyToMsgId: replyTo.replyToMsgId,
          replyToPeerId,
          replyToTopId: replyTo.topMsgId,
          quote: replyTo.quoteText !== undefined ? true : undefined,
          quoteText: replyTo.quoteText,
          quoteEntities: replyTo.quoteEntities,
          quoteOffset: replyTo.quoteOffset,
          todoItemId: replyTo.todoItemId,
          pollOption: replyTo.pollOption,
        },
        replyTo.monoforumPeerId ? inputPeerToPeer(replyTo.monoforumPeerId) : undefined,
      ]
    }
    case 'inputReplyToStory':
      return [
        {
          _: 'messageReplyStoryHeader',
          peer: inputPeerToPeer(replyTo.peer),
          storyId: replyTo.storyId,
        },
        undefined,
      ]
    case 'inputReplyToMonoForum':
      return [undefined, inputPeerToPeer(replyTo.monoforumPeerId)]
    case 'inputReplyToEphemeralMessage':
      return [
        {
          _: 'messageReplyHeader',
          replyToEphemeral: true,
          replyToMsgId: replyTo.id,
        },
        undefined,
      ]
  }
}

/**
 * Send a text message
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param text  Text of the message
 * @param params  Additional sending parameters
 */
export async function sendText(
  client: ITelegramClient,
  chatId: InputPeerLike,
  text: InputText,
  params?: CommonSendParams & {
    /** Override the default random ID, for streaming drafts */
    randomId?: Long

    /**
     * For bots: inline or reply markup or an instruction
     * to hide a reply keyboard or to force a reply.
     */
    replyMarkup?: ReplyMarkup

    /**
     * Whether to disable links preview in this message
     */
    disableWebPreview?: boolean

    /**
     * Whether to invert media position.
     *
     * Currently only supported for web previews and makes the
     * client render the preview above the caption and not below.
     */
    invertMedia?: boolean
  },
): Promise<Message> {
  if (!params) params = {}

  const [message, entities] = await _normalizeInputText(client, text)

  const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)
  const { peer, replyTo, scheduleDate, chainId, quickReplyShortcut } = await _processCommonSendParameters(
    client,
    chatId,
    params,
  )

  const randomId = params.randomId ?? randomLong()
  const sendAs = params.sendAs ? await resolvePeer(client, params.sendAs) : undefined
  const res = await client.call(
    {
      _: 'messages.sendMessage',
      peer,
      noWebpage: params.disableWebPreview,
      silent: params.silent,
      replyTo,
      randomId,
      scheduleDate,
      replyMarkup,
      message,
      entities,
      clearDraft: params.clearDraft,
      noforwards: params.forbidForwards,
      sendAs,
      invertMedia: params.invertMedia,
      quickReplyShortcut,
      effect: params.effect,
      allowPaidFloodskip: params.allowPaidFloodskip,
      allowPaidStars: params.allowPaidMessages,
    },
    {
      chainId,
      abortSignal: params.abortSignal,
      businessConnectionId: params.businessConnectionId,
    },
  )

  if (res._ === 'updateShortSentMessage') {
    // todo extract this to updates manager?
    const [replyToHeader, savedPeerId] = _inputReplyToToHeader(replyTo, peer)

    const msg: tl.RawMessage = {
      _: 'message',
      id: res.id,
      peerId: inputPeerToPeer(peer),
      fromId: sendAs ? inputPeerToPeer(sendAs) : { _: 'peerUser', userId: client.storage.self.getCached()!.userId },
      savedPeerId,
      replyTo: replyToHeader,
      message,
      date: res.date,
      out: res.out,
      silent: params.silent,
      noforwards: params.forbidForwards,
      invertMedia: params.invertMedia,
      effect: params.effect,
      replyMarkup,
      media: res.media,
      entities: res.entities,
      ttlPeriod: res.ttlPeriod,
    }

    if (!params.shouldDispatch) {
      client.handleClientUpdate(createDummyUpdate(res.pts, res.ptsCount))
    }

    const peers = new PeersIndex()

    const fetchPeer = async (peer: tl.TypePeer | tl.TypeInputPeer): Promise<void> => {
      const id = getMarkedPeerId(peer)

      let cached = await client.storage.peers.getCompleteById(id)

      if (!cached) {
        cached = await _getRawPeerBatched(client, await resolvePeer(client, peer))
      }

      if (!cached) {
        throw new MtTypeAssertionError('sendText (@ getFullPeerById)', 'user | chat', 'null')
      }

      switch (cached._) {
        case 'user':
          peers.users.set(cached.id, cached)
          break
        case 'chat':
        case 'chatForbidden':
        case 'channel':
        case 'channelForbidden':
          peers.chats.set(cached.id, cached)
          break
        default:
          throw new MtTypeAssertionError(
            'sendText (@ users.getUsers)',
            'user | chat | channel', // not very accurate, but good enough
            cached._,
          )
      }
    }

    const peersToFetch: (tl.TypePeer | tl.TypeInputPeer)[] = [peer, msg.fromId!]
    if (savedPeerId) peersToFetch.push(savedPeerId)
    if (replyToHeader?._ === 'messageReplyHeader' && replyToHeader.replyToPeerId) {
      peersToFetch.push(replyToHeader.replyToPeerId)
    } else if (replyToHeader?._ === 'messageReplyStoryHeader') {
      peersToFetch.push(replyToHeader.peer)
    }

    await Promise.all(peersToFetch.map(fetchPeer))

    if (
      replyToHeader?._ === 'messageReplyHeader'
      && replyToHeader.replyToTopId
      // general topic (id 1) doesn't count as a forum topic
      && replyToHeader.replyToTopId !== 1
      && msg.peerId._ === 'peerChannel'
    ) {
      const chat = peers.chats.get(msg.peerId.channelId)
      if (chat?._ === 'channel' && chat.forum) {
        replyToHeader.forumTopic = true
      }
    }

    const ret = new Message(msg, peers)

    return ret
  }

  const msg = _findMessageInUpdate(client, res, false, !params.shouldDispatch, false, randomId)

  return msg
}
