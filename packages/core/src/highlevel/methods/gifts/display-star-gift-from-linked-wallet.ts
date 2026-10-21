import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=user
/**
 * Show a unique star gift from the current user's TON wallet on a profile page,
 * or hide it from all profile pages. The gift remains in the wallet.
 */
export async function displayStarGiftFromLinkedWallet(
  client: ITelegramClient,
  params: {
    /** Slug of the unique star gift */
    slug: string

    /**
     * Current user or a channel owned by the current user on whose profile the gift will be shown.
     *
     * If not passed, the gift will be hidden from all profiles
     */
    peer?: InputPeerLike
  },
): Promise<void> {
  const res = await client.call({
    _: 'payments.displayStarGift',
    peer: params.peer ? await resolvePeer(client, params.peer) : undefined,
    slug: params.slug,
  })

  assertTrue('payments.displayStarGift', res)
}
