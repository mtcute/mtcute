import type { tl } from '@mtcute/tl'
import type { tlCompat } from '@mtcute/tl/compat'
import { objectEntries } from '@fuman/utils'
import { TlBinaryReader } from '@mtcute/tl-runtime'
import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlReaderMapCompat } from '@mtcute/tl/compat/reader.js'

function replaceType<
    Input extends tlCompat.TlObject,
    NewTypeName extends tl.TlObject['_'],
>(obj: Input, type: NewTypeName): Omit<Input, '_'> & { _: NewTypeName } {
    // modifying the object is safe because we have created the object ourselves inside the original reader fn
    return Object.assign(obj, { _: type })
}

function mapCompatStarGift(obj: tlCompat.TypeStarGift): tl.TypeStarGift {
    switch (obj._) {
        case 'starGiftUnique_layer197':
            return {
                ...obj,
                _: 'starGiftUnique',
                ownerId: obj.ownerId ? { _: 'peerUser', userId: obj.ownerId } : undefined,
            }
        case 'starGiftUnique_layer198':
            return replaceType(obj, 'starGiftUnique')
        default:
            return obj
    }
}

function mapCompatObject(obj: tlCompat.TlObject): tl.TlObject {
    switch (obj._) {
        case 'starGiftUnique_layer197':
        case 'starGiftUnique_layer198':
            return mapCompatStarGift(obj)
        case 'emojiStatus_layer197':
            return {
                _: 'emojiStatus',
                documentId: obj.documentId,
            }
        case 'messageMediaDocument_layer197':
            return replaceType(obj, 'messageMediaDocument')
        case 'channelFull_layer197':
            return replaceType(obj, 'channelFull')
        case 'messageActionStarGiftUnique_layer197':
            return {
                ...obj,
                _: 'messageActionStarGiftUnique',
                gift: mapCompatStarGift(obj.gift),
            }
        case 'messageActionStarGift_layer197':
            return {
                ...obj,
                _: 'messageActionStarGift',
                gift: mapCompatStarGift(obj.gift),
            }
        default:
            return obj
    }
}

function wrapReader(reader: (r: unknown) => unknown) {
    return (r: unknown) => mapCompatObject(reader(r) as tlCompat.TlObject)
}

function getCombinedReaderMap(): Record<number, (r: unknown) => unknown> {
    const ret: Record<number, (r: unknown) => unknown> = {
        ...__tlReaderMap,
    }

    for (const [id, reader] of objectEntries(__tlReaderMapCompat)) {
        ret[id] = wrapReader(reader)
    }

    return ret
}

const _combinedReaderMap = /* @__PURE__ */ getCombinedReaderMap()

/**
 * Deserialize a TL object previously serialized with {@link serializeObject},
 * with backwards compatibility for older versions of the schema.
 *
 * > **Note**: only some types from some layers are supported for backward compatibility,
 * > for the complete list please see [TYPES_FOR_COMPAT](https://github.com/mtcute/mtcute/blob/master/packages/tl/scripts/constants.ts)
 * > or [compat.tl](https://github.com/mtcute/mtcute/blob/master/packages/tl/data/compat.tl)
 */
export function deserializeObjectWithCompat(data: Uint8Array): tl.TlObject {
    return TlBinaryReader.deserializeObject(_combinedReaderMap, data)
}
