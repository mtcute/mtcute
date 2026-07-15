import type { ITelegramClient } from '../../client.types.js'
import type { ReplyMarkup } from '../../types/bots/keyboards/index.js'
import type { EphemeralMessage, InputMediaLike, InputPeerLike, InputText } from '../../types/index.js'

import { BotKeyboard } from '../../types/bots/keyboards/index.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'
import { _normalizeInputText } from '../misc/normalize-text.js'
import { resolvePeer, resolveUser } from '../users/resolve-peer.js'
import { _findEphemeralMessageInUpdate } from './find-in-update.js'

/**
 * Edit a previously sent ephemeral message
 */
export async function editEphemeralMessage(
  client: ITelegramClient,
  params: {
    /** Chat where the message was sent */
    chatId: InputPeerLike

    /** User the message is visible to */
    receiverId: InputPeerLike

    /** ID of the message to edit */
    messageId: number

    /** New text of the message */
    text?: InputText

    /** New media of the message */
    media?: InputMediaLike

    /** New reply markup of the message */
    replyMarkup?: ReplyMarkup

    /**
     * Whether to dispatch the returned updates
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<EphemeralMessage> {
  const { chatId, receiverId, messageId, text, media, replyMarkup, shouldDispatch } = params

  let message: string | undefined
  let entities

  if (text !== undefined) {
    [message, entities] = await _normalizeInputText(client, text)
  }

  const peer = await resolvePeer(client, chatId)

  const res = await client.call({
    _: 'ephemeral.editMessage',
    peer,
    receiverId: await resolveUser(client, receiverId),
    id: messageId,
    message,
    entities,
    media: media ? await _normalizeInputMedia(client, media, { uploadPeer: peer }) : undefined,
    replyMarkup: BotKeyboard._convertToTl(replyMarkup),
  })

  return _findEphemeralMessageInUpdate(client, res, true, !shouldDispatch)
}
