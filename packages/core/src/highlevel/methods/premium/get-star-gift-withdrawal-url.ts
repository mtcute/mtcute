import type { ITelegramClient } from '../../client.types.js'
import type { InputStarGift } from '../../types/index.js'
import { _normalizeInputStarGift } from './_normalize-input-star-gift.js'

export async function getStarGiftWithdrawalUrl(
    client: ITelegramClient,
    params: {
        /** The star gift to withdraw */
        gift: InputStarGift

        /** 2FA password */
        password: string
    },
): Promise<string> {
    const password = await client.computeSrpParams(
        await client.call({
            _: 'account.getPassword',
        }),
        params.password,
    )

    const res = await client.call({
        _: 'payments.getStarGiftWithdrawalUrl',
        stargift: await _normalizeInputStarGift(client, params.gift),
        password,
    })

    return res.url
}
