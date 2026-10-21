import type { ITelegramClient } from '../../client.types.js'
import type { InputStarGift } from '../../types/index.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { _normalizeInputStarGift } from './_normalize-input-star-gift.js'

// @available=user
/**
 * Withdraw a unique star gift to the TON blockchain as an NFT,
 * directly to the current user's TON wallet (which is created automatically if needed).
 *
 * The gift will be received by the wallet a few seconds after the request succeeds.
 */
export async function withdrawStarGiftToLinkedWallet(
  client: ITelegramClient,
  params: {
    /** The star gift to withdraw */
    gift: InputStarGift

    /** 2FA password */
    password: string

    /** Whether to keep the gift displayed on the profile after withdrawal */
    keepOnProfile?: boolean
  },
): Promise<void> {
  const password = await client.computeSrpParams(
    await client.call({
      _: 'account.getPassword',
    }),
    params.password,
  )

  const { tmpPassword } = await client.call({
    _: 'account.getTmpPassword',
    password,
    period: 60,
  })

  const res = await client.call({
    _: 'payments.withdrawStarGift',
    stargift: await _normalizeInputStarGift(client, params.gift),
    tmpPassword,
    keepOnProfile: params.keepOnProfile,
  })

  assertTrue('payments.withdrawStarGift', res)
}
