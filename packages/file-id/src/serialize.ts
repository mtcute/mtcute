import { tdFileId as td } from './types'
import { encodeUrlSafeBase64, BinaryWriter } from '@mtcute/core'
import { telegramRleEncode } from './utils'

const SUFFIX = Buffer.from([td.CURRENT_VERSION, td.PERSISTENT_ID_VERSION])

/**
 * Serialize an object with information about file
 * to TDLib and Bot API compatible File ID
 *
 * @param location  Information about file location
 */
export function toFileId(
    location: Omit<td.RawFullRemoteFileLocation, '_'>
): string {
    const loc = location.location

    let type: number = location.type
    if (loc._ === 'web') type |= td.WEB_LOCATION_FLAG
    if (location.fileReference) type |= td.FILE_REFERENCE_FLAG

    const writer = BinaryWriter.alloc(
        loc._ === 'web'
            ? // overhead of the web file id:
              // 8-16 bytes header,
              // 8 bytes for access hash,
              // up to 4 bytes for url
              Buffer.byteLength(loc.url, 'utf8') + 32
            : // longest file ids are around 80 bytes, so i guess
              // we are safe with allocating 100 bytes
              100
    )

    writer.int32(type)
    writer.int32(location.dcId)
    if (location.fileReference) {
        writer.bytes(location.fileReference)
    }

    switch (loc._) {
        case 'web':
            writer.string(loc.url)
            writer.long(loc.accessHash)
            break
        case 'photo':
            // todo: check how tdlib handles volume ids
            writer.long(loc.id)
            writer.long(loc.accessHash)
            writer.long(loc.volumeId)

            switch (loc.source._) {
                case 'legacy':
                    writer.int32(0)
                    writer.long(loc.source.secret)
                    break
                case 'thumbnail':
                    writer.int32(1)
                    writer.int32(loc.source.fileType)
                    writer.int32(loc.source.thumbnailType.charCodeAt(0))
                    break
                case 'dialogPhoto':
                    writer.int32(loc.source.big ? 3 : 2)
                    writer.long(loc.source.id)
                    writer.long(loc.source.accessHash)
                    break
                case 'stickerSetThumbnail':
                    writer.int32(4)
                    writer.long(loc.source.id)
                    writer.long(loc.source.accessHash)
                    break
            }

            writer.int32(loc.localId)
            break
        case 'common':
            writer.long(loc.id)
            writer.long(loc.accessHash)
            break
    }

    return encodeUrlSafeBase64(
        Buffer.concat([telegramRleEncode(writer.result()), SUFFIX])
    )
}
