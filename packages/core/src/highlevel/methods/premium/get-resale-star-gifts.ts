import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'
import type { ArrayPaginatedWithMeta } from '../../types/index.js'
import { assert, type MaybeArray } from '@fuman/utils'
import Long from 'long'
import { LongMap } from '../../../utils/long-utils.js'
import { PeersIndex, StarGiftUnique, StarGiftUniqueAttribute, StarGiftUniqueBackdrop } from '../../types/index.js'
import { makeArrayPaginatedWithMeta } from '../../utils/misc-utils.js'

// @exported
export interface InputStarGiftAttributeIds {
    model?: MaybeArray<Long>
    pattern?: MaybeArray<Long>
    backdrop?: MaybeArray<number>
}

export function _normalizeResaleAttributes(
    attrs: tl.TypeStarGiftAttributeId[] | InputStarGiftAttributeIds,
): tl.TypeStarGiftAttributeId[] {
    if (Array.isArray(attrs)) {
        return attrs
    }

    const res: tl.TypeStarGiftAttributeId[] = []

    if (attrs.model) {
        if (Array.isArray(attrs.model)) {
            for (const id of attrs.model) {
                res.push({
                    _: 'starGiftAttributeIdModel',
                    documentId: id,
                })
            }
        } else {
            res.push({
                _: 'starGiftAttributeIdModel',
                documentId: attrs.model,
            })
        }
    }

    if (attrs.pattern) {
        if (Array.isArray(attrs.pattern)) {
            for (const id of attrs.pattern) {
                res.push({
                    _: 'starGiftAttributeIdPattern',
                    documentId: id,
                })
            }
        } else {
            res.push({
                _: 'starGiftAttributeIdPattern',
                documentId: attrs.pattern,
            })
        }
    }

    if (attrs.backdrop) {
        if (Array.isArray(attrs.backdrop)) {
            for (const id of attrs.backdrop) {
                res.push({
                    _: 'starGiftAttributeIdBackdrop',
                    backdropId: id,
                })
            }
        } else {
            res.push({
                _: 'starGiftAttributeIdBackdrop',
                backdropId: attrs.backdrop,
            })
        }
    }

    return res
}

// @exported
export interface ResaleStarGiftsMeta {
    attributes: {
        model: LongMap<StarGiftUniqueAttribute>
        pattern: LongMap<StarGiftUniqueAttribute>
        backdrop: Map<number, StarGiftUniqueBackdrop>
    }
    attributesHash: tl.Long
    counters: tl.RawStarGiftAttributeCounter[]
}

/**
 * Get a list of star gifts up for resale
 */
export async function getStarGiftResaleOptions(
    client: ITelegramClient,
    params: {
        /** ID of the gift to get resale options for */
        giftId: tl.Long

        /**
         * Sorting attribute
         *
         * - `price`: Sort by price
         * - `num`: Sort by its unique number
         */
        sort?: 'price' | 'num'

        /**
         * Hash of the `attributes` field, as returned by the server in the first response
         */
        attributesHash?: Long

        /** Attributes to filter for */
        attributes?: tl.TypeStarGiftAttributeId[] | InputStarGiftAttributeIds

        /** Offset for pagination */
        offset?: string
        /** Limit for pagination */
        limit?: number
    },
): Promise<ArrayPaginatedWithMeta<StarGiftUnique, string, ResaleStarGiftsMeta>> {
    const res = await client.call({
        _: 'payments.getResaleStarGifts',
        sortByNum: params.sort === 'num',
        sortByPrice: params.sort === 'price',
        attributesHash: params.attributesHash,
        giftId: params.giftId,
        attributes: params.attributes ? _normalizeResaleAttributes(params.attributes) : undefined,
        offset: params.offset ?? '',
        limit: params.limit ?? 100,
    })

    const peers = PeersIndex.from(res)

    const attributes: ResaleStarGiftsMeta['attributes'] = {
        model: new LongMap(),
        pattern: new LongMap(),
        backdrop: new Map(),
    }

    for (const attr of res.attributes ?? []) {
        if (attr._ === 'starGiftAttributeModel') {
            attributes.model.set(attr.document.id, new StarGiftUniqueAttribute(attr))
        } else if (attr._ === 'starGiftAttributePattern') {
            attributes.pattern.set(attr.document.id, new StarGiftUniqueAttribute(attr))
        } else if (attr._ === 'starGiftAttributeBackdrop') {
            attributes.backdrop.set(attr.backdropId, new StarGiftUniqueBackdrop(attr))
        }
    }

    return makeArrayPaginatedWithMeta(
        res.gifts.map((it) => {
            assert(it._ === 'starGiftUnique')
            return new StarGiftUnique(it, peers)
        }),
        res.count,
        {
            attributes,
            attributesHash: res.attributesHash ?? params.attributesHash ?? Long.ZERO,
            counters: res.counters ?? [],
        },
        res.nextOffset,
    )
}

// todo remove in next major version

/**
 * Get a list of star gifts up for resale
 *
 * @deprecated Deprecated alias, use `getStarGiftResaleOptions` instead
 */
export async function getResaleOptions(
    client: ITelegramClient,
    params: Parameters<typeof getStarGiftResaleOptions>[1],
): Promise<ArrayPaginatedWithMeta<StarGiftUnique, string, ResaleStarGiftsMeta>> {
    return getStarGiftResaleOptions(client, params)
}
