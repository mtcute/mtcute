import { TlBinaryWriter } from '@mtcute/tl-runtime'
import { base64, utf8 } from '@fuman/utils'

import { tdFileId as td } from './types.js'
import { assertNever, telegramRleEncode } from './utils.js'

const SUFFIX = new Uint8Array([td.CURRENT_VERSION, td.PERSISTENT_ID_VERSION])

/**
 * Serialize an object with information about file
 * to TDLib and Bot API compatible File ID
 *
 * @param location  Information about file location
 */
export function toFileId(location: Omit<td.RawFullRemoteFileLocation, '_'>): string {
    const loc = location.location

    let type: number = location.type
    if (loc._ === 'web') type |= td.WEB_LOCATION_FLAG
    if (location.fileReference) type |= td.FILE_REFERENCE_FLAG

    // overhead of the web file id:
    // 8-16 bytes header,
    // 8 bytes for access hash,
    // up to 4 bytes for url
    //
    // longest file ids are around 80 bytes, so i guess
    // we are safe with allocating 100 bytes
    const writer = TlBinaryWriter.manual(loc._ === 'web' ? utf8.encodedLength(loc.url) + 32 : 100)

    writer.int(type)
    writer.int(location.dcId)

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

            switch (loc.source._) {
                case 'legacy':
                    writer.int(0)
                    writer.long(loc.source.secret)
                    break
                case 'thumbnail':
                    writer.int(1)
                    writer.int(loc.source.fileType)
                    writer.int(loc.source.thumbnailType.charCodeAt(0))
                    break
                case 'dialogPhoto':
                    writer.int(loc.source.big ? 3 : 2)
                    writer.int53(loc.source.id)
                    writer.long(loc.source.accessHash)
                    break
                case 'stickerSetThumbnail':
                    writer.int(4)
                    writer.long(loc.source.id)
                    writer.long(loc.source.accessHash)
                    break
                case 'fullLegacy':
                    writer.int(5)
                    writer.long(loc.source.volumeId)
                    writer.long(loc.source.secret)
                    writer.int(loc.source.localId)
                    break
                case 'dialogPhotoLegacy':
                    writer.int(loc.source.big ? 7 : 6)
                    writer.int53(loc.source.id)
                    writer.long(loc.source.accessHash)
                    writer.long(loc.source.volumeId)
                    writer.int(loc.source.localId)
                    break
                case 'stickerSetThumbnailLegacy':
                    writer.int(8)
                    writer.long(loc.source.id)
                    writer.long(loc.source.accessHash)
                    writer.long(loc.source.volumeId)
                    writer.int(loc.source.localId)
                    break
                case 'stickerSetThumbnailVersion':
                    writer.int(9)
                    writer.long(loc.source.id)
                    writer.long(loc.source.accessHash)
                    writer.int(loc.source.version)
                    break
                default:
                    assertNever(loc.source)
            }

            break
        case 'common':
            writer.long(loc.id)
            writer.long(loc.accessHash)
            break
        default:
            assertNever(loc)
    }

    const result = telegramRleEncode(writer.result())
    const withSuffix = new Uint8Array(result.length + SUFFIX.length)
    withSuffix.set(result)
    withSuffix.set(SUFFIX, result.length)

    return base64.encode(withSuffix, true)
}
