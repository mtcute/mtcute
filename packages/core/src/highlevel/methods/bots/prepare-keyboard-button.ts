import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, InputReplyKeyboardButton } from '../../types/index.js'
import { _toReplyButton } from '../../types/bots/keyboards/normalize.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Prepare a keyboard button to be shown to the user later from the bot's mini app.
 *
 * Only {@link BotKeyboard.requestPeer} and {@link BotKeyboard.requestManagedBot}
 * buttons are supported.
 *
 * @param userId  User to whom the button will be shown
 * @param button  The button to prepare
 * @returns  ID of the prepared button
 */
export async function prepareKeyboardButton(
  client: ITelegramClient,
  userId: InputPeerLike,
  button: InputReplyKeyboardButton,
): Promise<string> {
  const res = await client.call({
    _: 'bots.requestWebViewButton',
    userId: await resolveUser(client, userId),
    button: _toReplyButton(button),
  })

  return res.webappReqId
}
