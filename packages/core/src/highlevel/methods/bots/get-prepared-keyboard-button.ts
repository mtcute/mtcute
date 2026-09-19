import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Get a keyboard button prepared by a bot for the current user
 * (see {@link prepareKeyboardButton})
 *
 * @param botId  Bot that prepared the button
 * @param preparedId  ID of the prepared button
 */
export async function getPreparedKeyboardButton(
  client: ITelegramClient,
  botId: InputPeerLike,
  preparedId: string,
): Promise<tl.TypeKeyboardButton> {
  return client.call({
    _: 'bots.getRequestedWebViewButton',
    bot: await resolveUser(client, botId),
    webappReqId: preparedId,
  })
}
