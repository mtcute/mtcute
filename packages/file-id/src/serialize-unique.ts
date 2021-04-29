import { tdFileId as td } from './types'
import { BinaryWriter } from '@mtcute/core/src/utils/binary/binary-writer'
import { encodeUrlSafeBase64, telegramRleEncode } from './utils'

/**
 * Serialize an object with information about file
 * to TDLib and Bot API compatible Unique File ID
 *
 * Unique File IDs can't be used to download or reuse files,
 * but they are globally unique, meaning that the same file will
 * have the same unique ID regardless of the user who created
 * this ID (unlike normal File IDs, that also contain user-bound
 * file access hash)
 *
 * @param location  Information about file location
 */
export function toUniqueFileId(
    location: Omit<td.RawFullRemoteFileLocation, '_'>
): string {
    let type
    if (location.location._ === 'web') {
        type = 0
    } else {
        switch (location.type) {
            case td.FileType.Photo:
            case td.FileType.ProfilePhoto:
            case td.FileType.Thumbnail:
            case td.FileType.EncryptedThumbnail:
            case td.FileType.Wallpaper:
                type = 1
                break
            case td.FileType.Video:
            case td.FileType.VoiceNote:
            case td.FileType.Document:
            case td.FileType.Sticker:
            case td.FileType.Audio:
            case td.FileType.Animation:
            case td.FileType.VideoNote:
            case td.FileType.Background:
            case td.FileType.DocumentAsFile:
                type = 2
                break
            case td.FileType.SecureRaw:
            case td.FileType.Secure:
                type = 3
                break
            case td.FileType.Encrypted:
                type = 4
                break
            case td.FileType.Temp:
                type = 5
                break
            default:
                throw new td.InvalidFileIdError(
                    `Invalid file type: ${location.type}`
                )
        }
    }

    let writer: BinaryWriter
    if (location.location._ === 'photo') {
        writer = BinaryWriter.alloc(16)
        writer.int32(type)
        writer.long(location.location.volumeId)
        writer.int32(location.location.localId)
    } else if (location.location._ === 'web') {
        writer = BinaryWriter.alloc(
            Buffer.byteLength(location.location.url, 'utf-8') + 8
        )
        writer.int32(type)
        writer.string(location.location.url)
    } else if (location.location._ === 'common') {
        writer = BinaryWriter.alloc(12)
        writer.int32(type)
        writer.long(location.location.id)
    } else {
        throw new td.UnsupportedError(
            `Unique IDs are not supported for ${(location.location as any)._}`
        )
    }

    return encodeUrlSafeBase64(telegramRleEncode(writer.result()))
}
