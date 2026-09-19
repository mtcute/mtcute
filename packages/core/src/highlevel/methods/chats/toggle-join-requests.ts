import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { resolveChannel, resolveUser } from '../users/resolve-peer.js'

/**
 * Set whether a channel/supergroup has join requests enabled.
 *
 * > **Note**: by default, this method only affects primary invite links.
 * > Additional invite links may exist with the opposite setting,
 * > unless {@link applyToInviteLinks} is passed.
 *
 * @param chatId  Chat ID or username
 * @param enabled  Whether join requests should be enabled
 */
export async function toggleJoinRequests(
  client: ITelegramClient,
  chatId: InputPeerLike,
  enabled = false,
  params?: {
    /**
     * Bot that will be the guard bot in the group, i.e. will approve or decline
     * join requests. Ignored if {@link enabled} is `false`.
     *
     * The bot must be an admin with `inviteUsers` right, and must be marked as a guard bot.
     */
    guardBot?: InputPeerLike

    /**
     * Whether to apply the change to the existing invite links, including the primary one
     */
    applyToInviteLinks?: boolean
  },
): Promise<void> {
  const res = await client.call({
    _: 'channels.toggleJoinRequest',
    channel: await resolveChannel(client, chatId),
    enabled,
    guardBot: params?.guardBot ? await resolveUser(client, params.guardBot) : undefined,
    applyToInvites: params?.applyToInviteLinks,
  })
  client.handleClientUpdate(res)
}
