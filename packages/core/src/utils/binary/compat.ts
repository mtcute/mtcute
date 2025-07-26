import type { tlCompat } from '@mtcute/tl/compat'
import { Bytes, read } from '@fuman/io'
import { assert, objectEntries } from '@fuman/utils'
import { tl } from '@mtcute/tl'
import { TlBinaryReader } from '@mtcute/tl-runtime'
import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlReaderMapCompat } from '@mtcute/tl/compat/reader.js'
import { PeersIndex } from '../../highlevel/types/peers/peers-index.js'

function replaceType<
    Input extends tlCompat.TlObject,
    NewTypeName extends tl.TlObject['_'],
>(obj: Input, type: NewTypeName): Omit<Input, '_'> & { _: NewTypeName } {
    // modifying the object is safe because we have created the object ourselves inside the original reader fn
    return Object.assign(obj, { _: type })
}

function dropFields<T extends tlCompat.TlObject, const Fields extends (keyof T)[]>(
    obj: T,
    fields: Fields,
): Omit<T, Fields[number]> {
    for (let i = 0; i < fields.length; i++) {
        delete obj[fields[i]]
    }
    return obj
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
        case 'starGiftUnique_layer202':
        case 'starGiftUnique_layer206':
            return replaceType(obj, 'starGiftUnique')
        case 'starGift_layer202':
        case 'starGift_layer206':
        case 'starGift_layer209':
            return replaceType(obj, 'starGift')
        default:
            return obj
    }
}

function mapCompatEmojiStatus(obj: tlCompat.TypeEmojiStatus): tl.TypeEmojiStatus {
    switch (obj._) {
        case 'emojiStatus_layer197':
            return {
                ...obj,
                _: 'emojiStatus',
                documentId: obj.documentId,
            }
        default:
            return obj
    }
}

function mapCompatMessageMedia(obj: tlCompat.TypeMessageMedia): tl.TypeMessageMedia {
    switch (obj._) {
        case 'messageMediaDocument_layer197':
            return replaceType(obj, 'messageMediaDocument')
        default:
            return obj
    }
}

function mapCompatMessageAction(obj: tlCompat.TypeMessageAction): tl.TypeMessageAction {
    switch (obj._) {
        case 'messageActionStarGiftUnique_layer197':
        case 'messageActionStarGiftUnique_layer202':
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
        case 'messageActionPaidMessagesPrice_layer203':
            return replaceType(obj, 'messageActionPaidMessagesPrice')
        default:
            return obj
    }
}

function mapMessageReplyHeader(obj: tlCompat.TypeMessageReplyHeader): tl.TypeMessageReplyHeader {
    switch (obj._) {
        case 'messageReplyHeader_layer206':
            return {
                ...obj,
                _: 'messageReplyHeader',
                replyMedia: obj.replyMedia ? mapCompatMessageMedia(obj.replyMedia) : undefined,
            }
        default:
            return obj
    }
}

function mapCompatMessage(obj: tlCompat.TypeMessage): tl.TypeMessage {
    switch (obj._) {
        case 'message_layer199':
        case 'message_layer204':
            return {
                ...obj,
                _: 'message',
                media: obj.media ? mapCompatMessageMedia(obj.media) : undefined,
                replyTo: obj.replyTo ? mapMessageReplyHeader(obj.replyTo) : undefined,
            }
        case 'messageService_layer204':
            return {
                ...obj,
                _: 'messageService',
                action: mapCompatMessageAction(obj.action),
                replyTo: obj.replyTo ? mapMessageReplyHeader(obj.replyTo) : undefined,
            }
        default:
            return obj
    }
}

function mapCompatObject(obj: tlCompat.TlObject): tl.TlObject {
    switch (obj._) {
        case 'starGiftUnique_layer197':
        case 'starGiftUnique_layer198':
        case 'starGiftUnique_layer202':
        case 'starGiftUnique_layer206':
        case 'starGift_layer202':
        case 'starGift_layer206':
        case 'starGift_layer209':
            return mapCompatStarGift(obj)
        case 'emojiStatus_layer197':
            return mapCompatEmojiStatus(obj)
        case 'messageMediaDocument_layer197':
            return mapCompatMessageMedia(obj)
        case 'channelFull_layer197':
        case 'channelFull_layer204':
            return replaceType(obj, 'channelFull')
        case 'messageActionStarGiftUnique_layer197':
        case 'messageActionStarGift_layer197':
        case 'messageActionStarGiftUnique_layer202':
        case 'messageActionPaidMessagesPrice_layer203':
            return mapCompatMessageAction(obj)
        case 'userFull_layer199':
            return replaceType(dropFields(obj, ['premiumGifts']), 'userFull')
        case 'userFull_layer200':
        case 'userFull_layer209':
            return replaceType(obj, 'userFull')
        case 'user_layer199':
            return {
                ...obj,
                _: 'user',
                emojiStatus: obj.emojiStatus ? mapCompatEmojiStatus(obj.emojiStatus) : undefined,
            }
        case 'channel_layer199':
        case 'channel_layer203':
            return {
                ...obj,
                _: 'channel',
                emojiStatus: obj.emojiStatus ? mapCompatEmojiStatus(obj.emojiStatus) : undefined,
            }
        case 'phoneCallDiscardReasonAllowGroupCall_layer202':
            // removed constructor in favor of phoneCallDiscardReasonMigrateConferenceCall,
            // which requires extra info we don't have
            return { _: 'phoneCallDiscardReasonMissed' }
        case 'message_layer199':
        case 'message_layer204':
        case 'messageService_layer204':
            return mapCompatMessage(obj)
        case 'messageReplyHeader_layer206':
            return mapMessageReplyHeader(obj)
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

/** Helper function to deserialize a {@link PeersIndex} with backwards compatibility */
export function deserializePeersIndexWithCompat(data: Uint8Array): PeersIndex {
    const res = new PeersIndex()

    const bytes = Bytes.from(data)

    const userCount = read.int32le(bytes)
    for (let i = 0; i < userCount; i++) {
        const len = read.int32le(bytes)
        const obj = deserializeObjectWithCompat(read.exactly(bytes, len))
        assert(tl.isAnyUser(obj))
        res.users.set(obj.id, obj)
    }

    const chatCount = read.int32le(bytes)
    for (let i = 0; i < chatCount; i++) {
        const len = read.int32le(bytes)
        const obj = deserializeObjectWithCompat(read.exactly(bytes, len))
        assert(tl.isAnyChat(obj))
        res.chats.set(obj.id, obj)
    }

    return res
}
