import { base64 } from '@fuman/utils'
import { TlBinaryReader } from '@mtcute/tl-runtime'

import { tdFileId as td } from './types.js'
import { telegramRleDecode } from './utils.js'

function parseWebFileLocation(reader: TlBinaryReader): td.RawWebRemoteFileLocation {
    return {
        _: 'web',
        url: reader.string(),
        accessHash: reader.long(),
    }
}

function parsePhotoSizeSource(reader: TlBinaryReader): td.TypePhotoSizeSource {
    const variant = reader.int()

    switch (variant) {
        case 0 /* LEGACY */:
            return {
                _: 'legacy',
                secret: reader.long(),
            }
        case 1 /* THUMBNAIL */: {
            const fileType = reader.int()

            if (fileType < 0 || fileType >= td.FileType.Size) {
                throw new td.UnsupportedError(
                    `Unsupported file type: ${fileType} (${base64.encode(reader.uint8View)})`,
                )
            }

            const thumbnailType = reader.int()

            if (thumbnailType < 0 || thumbnailType > 255) {
                throw new td.InvalidFileIdError(
                    `Wrong thumbnail type: ${thumbnailType} (${base64.encode(reader.uint8View)})`,
                )
            }

            return {
                _: 'thumbnail',
                fileType,
                thumbnailType: String.fromCharCode(thumbnailType),
            }
        }
        case 2 /* DIALOG_PHOTO_SMALL */:
        case 3 /* DIALOG_PHOTO_BIG */:
            return {
                _: 'dialogPhoto',
                big: variant === 3,
                id: reader.int53(),
                accessHash: reader.long(),
            }
        case 4 /* STICKERSET_THUMBNAIL */:
            return {
                _: 'stickerSetThumbnail',
                id: reader.long(),
                accessHash: reader.long(),
            }
        case 5 /* FULL_LEGACY */: {
            const res: td.RawPhotoSizeSourceFullLegacy = {
                _: 'fullLegacy',
                volumeId: reader.long(),
                secret: reader.long(),
                localId: reader.int(),
            }

            if (res.localId < 0) {
                throw new td.InvalidFileIdError('Wrong local_id (< 0)')
            }

            return res
        }
        case 6 /* DIALOG_PHOTO_SMALL_LEGACY */:
        case 7 /* DIALOG_PHOTO_BIG_LEGACY */: {
            const res: td.RawPhotoSizeSourceDialogPhotoLegacy = {
                _: 'dialogPhotoLegacy',
                big: variant === 7,
                id: reader.int53(),
                accessHash: reader.long(),
                volumeId: reader.long(),
                localId: reader.int(),
            }

            if (res.localId < 0) {
                throw new td.InvalidFileIdError('Wrong local_id (< 0)')
            }

            return res
        }
        case 8 /* STICKERSET_THUMBNAIL_LEGACY */: {
            const res: td.RawPhotoSizeSourceStickerSetThumbnailLegacy = {
                _: 'stickerSetThumbnailLegacy',
                id: reader.long(),
                accessHash: reader.long(),
                volumeId: reader.long(),
                localId: reader.int(),
            }

            if (res.localId < 0) {
                throw new td.InvalidFileIdError('Wrong local_id (< 0)')
            }

            return res
        }
        case 9 /* STICKERSET_THUMBNAIL_VERSION */:
            return {
                _: 'stickerSetThumbnailVersion',
                id: reader.long(),
                accessHash: reader.long(),
                version: reader.int(),
            }
        default:
            throw new td.UnsupportedError(
                `Unsupported photo size source ${variant} (${base64.encode(reader.uint8View)})`,
            )
    }
}

function parsePhotoFileLocation(
    reader: TlBinaryReader,
    version: number,
): td.RawPhotoRemoteFileLocation {
    const id = reader.long()
    const accessHash = reader.long()
    let source: td.TypePhotoSizeSource

    if (version >= 32) {
        source = parsePhotoSizeSource(reader)
    } else {
        const volumeId = reader.long()
        let localId = 0

        if (version >= 22) {
            source = parsePhotoSizeSource(reader)
            localId = reader.int()
        } else {
            source = {
                _: 'fullLegacy',
                secret: reader.long(),
                localId: reader.int(),
                volumeId,
            }
        }

        switch (source._) {
            case 'legacy':
                source = {
                    _: 'fullLegacy',
                    secret: reader.long(),
                    localId: reader.int(),
                    volumeId,
                }
                break
            case 'fullLegacy':
            case 'thumbnail':
                break
            case 'dialogPhoto':
                source = {
                    _: 'dialogPhotoLegacy',
                    id: source.id,
                    accessHash: source.accessHash,
                    big: source.big,
                    localId,
                    volumeId,
                }
                break
            case 'stickerSetThumbnail':
                source = {
                    _: 'stickerSetThumbnailLegacy',
                    id: source.id,
                    accessHash: source.accessHash,
                    localId,
                    volumeId,
                }
                break
            default:
                throw new td.InvalidFileIdError('Invalid PhotoSizeSource in legacy PhotoRemoteFileLocation')
        }
    }

    return {
        _: 'photo',
        id,
        accessHash,
        source,
    }
}

function parseCommonFileLocation(reader: TlBinaryReader): td.RawCommonRemoteFileLocation {
    return {
        _: 'common',
        id: reader.long(),
        accessHash: reader.long(),
    }
}

function fromPersistentIdV23(binary: Uint8Array, version: number): td.RawFullRemoteFileLocation {
    if (version < 0 || version > td.CURRENT_VERSION) {
        throw new td.UnsupportedError(`Unsupported file ID v3 subversion: ${version} (${base64.encode(binary)})`)
    }

    binary = telegramRleDecode(binary)

    const reader = TlBinaryReader.manual(binary)

    let fileType = reader.int()

    const isWeb = Boolean(fileType & td.WEB_LOCATION_FLAG)
    const hasFileReference = Boolean(fileType & td.FILE_REFERENCE_FLAG)

    fileType &= ~td.WEB_LOCATION_FLAG
    fileType &= ~td.FILE_REFERENCE_FLAG

    if (fileType < 0 || fileType >= td.FileType.Size) {
        throw new td.UnsupportedError(`Unsupported file type: ${fileType} (${base64.encode(binary)})`)
    }

    const dcId = reader.int()

    let fileReference: Uint8Array | null = null

    if (hasFileReference) {
        fileReference = reader.bytes()

        if (fileReference.length === 1 && fileReference[0] === 0x23 /* # */) {
            // "invalid file reference"
            // see https://github.com/tdlib/td/blob/ed291840d3a841bb5b49457c88c57e8467e4a5b0/td/telegram/files/FileLocation.h#L32
            fileReference = null
        }
    }

    let location: td.TypeRemoteFileLocation

    if (isWeb) {
        location = parseWebFileLocation(reader)
    } else {
        switch (fileType) {
            case td.FileType.Photo:
            case td.FileType.ProfilePhoto:
            case td.FileType.Thumbnail:
            case td.FileType.EncryptedThumbnail:
            case td.FileType.Wallpaper: {
                // location_type = photo
                location = parsePhotoFileLocation(reader, version)

                // validate
                switch (location.source._) {
                    case 'thumbnail':
                        if (
                            location.source.fileType !== fileType
                            || (fileType !== td.FileType.Photo
                            && fileType !== td.FileType.Thumbnail
                            && fileType !== td.FileType.EncryptedThumbnail)
                        ) {
                            throw new td.InvalidFileIdError('Invalid FileType in PhotoRemoteFileLocation Thumbnail')
                        }
                        break
                    case 'dialogPhoto':
                    case 'dialogPhotoLegacy':
                        if (fileType !== td.FileType.ProfilePhoto) {
                            throw new td.InvalidFileIdError('Invalid FileType in PhotoRemoteFileLocation DialogPhoto')
                        }
                        break
                    case 'stickerSetThumbnail':
                    case 'stickerSetThumbnailLegacy':
                    case 'stickerSetThumbnailVersion':
                        if (fileType !== td.FileType.Thumbnail) {
                            throw new td.InvalidFileIdError(
                                'Invalid FileType in PhotoRemoteFileLocation StickerSetThumbnail',
                            )
                        }
                        break
                }

                break
            }
            case td.FileType.Video:
            case td.FileType.VoiceNote:
            case td.FileType.Document:
            case td.FileType.Sticker:
            case td.FileType.Audio:
            case td.FileType.Animation:
            case td.FileType.Encrypted:
            case td.FileType.VideoNote:
            case td.FileType.SecureRaw:
            case td.FileType.Secure:
            case td.FileType.Background:
            case td.FileType.DocumentAsFile: {
                // location_type = common
                location = parseCommonFileLocation(reader)
                break
            }
            default:
                throw new td.UnsupportedError(`Invalid file type: ${fileType} (${base64.encode(binary)})`)
        }
    }

    return {
        _: 'remoteFileLocation',
        dcId,
        type: fileType,
        fileReference,
        location,
    }
}

function fromPersistentIdV2(binary: Uint8Array) {
    return fromPersistentIdV23(binary.subarray(0, -1), 0)
}

function fromPersistentIdV3(binary: Uint8Array) {
    const subversion = binary[binary.length - 2]

    return fromPersistentIdV23(binary.subarray(0, -2), subversion)
}

/**
 * Parse TDLib and Bot API compatible File ID
 *
 * @param fileId  File ID as a base-64 encoded string or Buffer
 */
export function parseFileId(fileId: string | Uint8Array): td.RawFullRemoteFileLocation {
    if (typeof fileId === 'string') fileId = base64.decode(fileId, true)

    const version = fileId[fileId.length - 1]

    if (version === td.PERSISTENT_ID_VERSION_OLD) {
        return fromPersistentIdV2(fileId)
    }

    if (version === td.PERSISTENT_ID_VERSION) {
        return fromPersistentIdV3(fileId)
    }

    throw new td.UnsupportedError(`Unsupported file ID version: ${version} (${base64.encode(fileId)})`)
}
