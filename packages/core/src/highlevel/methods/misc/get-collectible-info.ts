import { ITelegramClient } from '../../client.types.js'
import { CollectibleInfo } from '../../types/misc/collectible-info.js'
import { normalizePhoneNumber } from '../../utils/misc-utils.js'

// @available=user
/**
 * Get information about a fragment collectible
 */
export async function getCollectibleInfo(
    client: ITelegramClient,
    kind: 'phone' | 'username',
    item: string,
): Promise<CollectibleInfo> {
    const res = await client.call({
        _: 'fragment.getCollectibleInfo',
        collectible:
            kind === 'phone' ?
                {
                    _: 'inputCollectiblePhone',
                    phone: normalizePhoneNumber(item),
                } :
                {
                    _: 'inputCollectibleUsername',
                    username: item,
                },
    })

    return new CollectibleInfo(res)
}
