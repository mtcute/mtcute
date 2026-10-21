import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=user
/**
 * Get information needed to deposit a unique star gift from the current user's
 * TON wallet to a Telegram account.
 *
 * The gift must then be transferred by an internal message from the wallet to `nftAddress`
 * with `amount` attached and `payload` as the message body.
 */
export async function getStarGiftDepositInfo(
  client: ITelegramClient,
  params: {
    /** Slug of the unique star gift */
    slug: string

    /** User or channel that will receive the gift */
    recipient: InputPeerLike

    /** Whether to hide the sender of the gift in the message received by the recipient */
    hideSender?: boolean
  },
): Promise<{
  /** Address in TON blockchain to which the message must be sent */
  nftAddress: string
  /** Body of the NFT transfer message */
  payload: Uint8Array
  /**
   * Amount of nanotons that must be attached to the message to cover fees.
   * Excess amount will be returned to the wallet
   */
  amount: tl.Long
}> {
  const res = await client.call({
    _: 'payments.depositStarGift',
    peer: await resolvePeer(client, params.recipient),
    slug: params.slug,
    hideSender: params.hideSender,
  })

  return {
    nftAddress: res.nftAddress,
    payload: res.payload,
    amount: res.amount,
  }
}
