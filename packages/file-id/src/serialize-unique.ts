import { ITlPlatform, TlBinaryWriter } from '@mtcute/tl-runtime'

import { tdFileId as td } from './types.js'
import { assertNever, telegramRleEncode } from './utils.js'

export type InputUniqueLocation =
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
export function toUniqueFileId(platform: ITlPlatform, location: Omit<td.RawFullRemoteFileLocation, '_'>): string
export function toUniqueFileId(platform: ITlPlatform, type: td.FileType, location: InputUniqueLocation): string

export function toUniqueFileId(
    platform: ITlPlatform,
    first: td.FileType | Omit<td.RawFullRemoteFileLocation, '_'>,
    second?: InputUniqueLocation,
): string {
    const inputType = typeof first === 'number' ? first : first.type
    // guaranteed by type signature

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
                throw new td.InvalidFileIdError(`Invalid file type: ${inputType}`)
        }
    }

    let writer: TlBinaryWriter

    switch (inputLocation._) {
        case 'photo': {
            const source = inputLocation.source

            switch (source._) {
                case 'legacy': {
                    // tdlib does not implement this
                    writer = TlBinaryWriter.manual(16)
                    writer.int(type)
                    writer.int(100)
                    writer.long(source.secret)
                    break
                }
                case 'stickerSetThumbnail': {
                    // tdlib does not implement this
                    writer = TlBinaryWriter.manual(24)
                    writer.int(type)
                    writer.int(150)
                    writer.long(source.id)
                    writer.long(source.accessHash)
                    break
                }
                case 'dialogPhoto': {
                    writer = TlBinaryWriter.manual(13)
                    writer.int(type)
                    writer.long(inputLocation.id)
                    writer.raw(new Uint8Array([Number(source.big)]))
                    // it doesn't matter to which Dialog the photo belongs
                    break
                }
                case 'thumbnail': {
                    writer = TlBinaryWriter.manual(13)

                    let thumbType = source.thumbnailType.charCodeAt(0)

                    if (thumbType === 97 /* 'a' */) {
                        thumbType = 0
                    } else if (thumbType === 99 /* 'c' */) {
                        thumbType = 1
                    } else {
                        thumbType += 5
                    }

                    writer.int(type)
                    writer.long(inputLocation.id)
                    writer.raw(new Uint8Array([thumbType]))
                    break
                }
                case 'fullLegacy':
                case 'dialogPhotoLegacy':
                case 'stickerSetThumbnailLegacy':
                    writer = TlBinaryWriter.manual(16)
                    writer.int(type)
                    writer.long(source.volumeId)
                    writer.int(source.localId)
                    break
                case 'stickerSetThumbnailVersion':
                    writer = TlBinaryWriter.manual(17)
                    writer.int(type)
                    writer.raw(new Uint8Array([2]))
                    writer.long(source.id)
                    writer.int(source.version)
                    break
            }
            break
        }
        case 'web':
            writer = TlBinaryWriter.manual(platform.utf8ByteLength(inputLocation.url) + 8)
            writer.int(type)
            writer.string(inputLocation.url)
            break
        case 'common':
            writer = TlBinaryWriter.manual(12)
            writer.int(type)
            writer.long(inputLocation.id)
            break
        default:
            assertNever(inputLocation)
    }

    return platform.base64Encode(telegramRleEncode(writer.result()), true)
}
