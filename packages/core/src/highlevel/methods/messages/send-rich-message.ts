import type Long from 'long'

import type { ITelegramClient } from '../../client.types.js'
import type { ReplyMarkup } from '../../types/bots/keyboards/index.js'
import type { Message } from '../../types/messages/message.js'
import type { InputRichMessage, RichMediaUploadCache } from '../../types/messages/rich/types.js'
import type { InputPeerLike } from '../../types/peers/index.js'
import type { CommonSendParams } from './send-common.js'
import { randomLong } from '../../../utils/long-utils.js'
import { BotKeyboard } from '../../types/bots/keyboards/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _findMessageInUpdate } from './find-in-update.js'
import { _normalizeInputRichMessage } from './normalize-rich-message.js'
import { _processCommonSendParameters } from './send-common.js'

/**
 * Send a rich message
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param params  Rich message contents and additional sending parameters
 */
export async function sendRichMessage(
  client: ITelegramClient,
  chatId: InputPeerLike,
  params: CommonSendParams & {
    content: InputRichMessage

    /** Override the default random ID, for streaming drafts */
    randomId?: Long

    /**
     * For bots: inline or reply markup or an instruction
     * to hide a reply keyboard or to force a reply.
     */
    replyMarkup?: ReplyMarkup

    /**
     * Function that will be called after some part has been uploaded.
     *
     * @param id  ID of the file being uploaded
     * @param uploaded  Number of bytes already uploaded
     * @param total  Total file size
     */
    progressCallback?: (id: string, uploaded: number, total: number) => void

    /**
     * Cache for uploaded media, used to avoid re-uploading the same media multiple times.
     *
     * Pass a (potentially shared) {@link RichMediaUploadCache} to reuse media uploaded
     * by an earlier call (e.g. a streaming draft) instead of uploading it again.
     */
    uploadCache?: RichMediaUploadCache
  },
): Promise<Message> {
  const { peer, replyTo, scheduleDate, chainId, quickReplyShortcut } = await _processCommonSendParameters(
    client,
    chatId,
    params,
  )

  const richMessage = await _normalizeInputRichMessage(client, peer, params.content, params)
  const randomId = params.randomId ?? randomLong()
  const res = await client.call(
    {
      _: 'messages.sendMessage',
      peer,
      silent: params.silent,
      replyTo,
      randomId,
      scheduleDate,
      replyMarkup: BotKeyboard._convertToTl(params.replyMarkup),
      message: '',
      clearDraft: params.clearDraft,
      noforwards: params.forbidForwards,
      sendAs: params.sendAs ? await resolvePeer(client, params.sendAs) : undefined,
      quickReplyShortcut,
      effect: params.effect,
      allowPaidFloodskip: params.allowPaidFloodskip,
      allowPaidStars: params.allowPaidMessages,
      richMessage,
    },
    {
      chainId,
      abortSignal: params.abortSignal,
      businessConnectionId: params.businessConnectionId,
    },
  )

  return _findMessageInUpdate(client, res, false, !params.shouldDispatch, false, randomId)
}
