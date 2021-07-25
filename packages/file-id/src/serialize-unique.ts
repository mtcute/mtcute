import { tdFileId, tdFileId as td } from './types'
import { encodeUrlSafeBase64, BinaryWriter } from '@mtqt/core'
import { telegramRleEncode } from './utils'
import FileType = tdFileId.FileType

type InputUniqueLocation =
    | Pick<td.RawWebRemoteFileLocation, '_' | 'url'>
    | Pick<td.RawPhotoRemoteFileLocation, '_' | 'id' | 'source'>
    | Pick<td.RawCommonRemoteFileLocation, '_' | 'id'>

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
): string
export function toUniqueFileId(
    type: FileType,
    location: InputUniqueLocation
): string
export function toUniqueFileId(
    first: FileType | Omit<td.RawFullRemoteFileLocation, '_'>,
    second?: InputUniqueLocation
): string {
    const inputType = typeof first === 'number' ? first : first.type
    const inputLocation = typeof first === 'number' ? second! : first.location

    let type
    if (inputLocation._ === 'web') {
        type = 0
    } else {
        switch (inputType) {
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
                    `Invalid file type: ${inputType}`
                )
        }
    }

    let writer: BinaryWriter
    switch (inputLocation._) {
        case 'photo': {
            const source = inputLocation.source
            switch (source._) {
                case 'legacy': {
                    // tdlib does not implement this
                    writer = BinaryWriter.alloc(16)
                    writer.int32(type)
                    writer.int32(100)
                    writer.long(source.secret)
                    break
                }
                case 'stickerSetThumbnail': {
                    // tdlib does not implement this
                    writer = BinaryWriter.alloc(24)
                    writer.int32(type)
                    writer.int32(150)
                    writer.long(source.id)
                    writer.long(source.accessHash)
                    break
                }
                case 'dialogPhoto': {
                    writer = BinaryWriter.alloc(13)
                    writer.int32(type)
                    writer.long(inputLocation.id)
                    writer.raw(Buffer.from([+source.big]))
                    // it doesn't matter to which Dialog the photo belongs
                    break
                }
                case 'thumbnail': {
                    writer = BinaryWriter.alloc(13)

                    let thumbType = source.thumbnailType.charCodeAt(0)
                    if (thumbType === 97 /* 'a' */) {
                        thumbType = 0
                    } else if (thumbType === 99 /* 'c' */) {
                        thumbType = 1
                    } else {
                        thumbType += 5
                    }

                    writer.int32(type)
                    writer.long(inputLocation.id)
                    writer.raw(Buffer.from([thumbType]))
                    break
                }
                case 'fullLegacy':
                case 'dialogPhotoLegacy':
                case 'stickerSetThumbnailLegacy':
                    writer = BinaryWriter.alloc(16)
                    writer.int32(type)
                    writer.long(source.volumeId)
                    writer.int32(source.localId)
                    break
                case 'stickerSetThumbnailVersion':
                    writer = BinaryWriter.alloc(17)
                    writer.int32(type)
                    writer.raw(Buffer.from([2]))
                    writer.long(source.id)
                    writer.int32(source.version)
                    break
            }
            break
        }
        case 'web':
            writer = BinaryWriter.alloc(
                Buffer.byteLength(inputLocation.url, 'utf-8') + 8
            )
            writer.int32(type)
            writer.string(inputLocation.url)
            break
        case 'common':
            writer = BinaryWriter.alloc(12)
            writer.int32(type)
            writer.long(inputLocation.id)
            break
        default:
            throw new td.UnsupportedError(
                `Unique IDs are not supported for ${(inputLocation as any)._}`
            )
    }

    return encodeUrlSafeBase64(telegramRleEncode(writer.result()))
}
