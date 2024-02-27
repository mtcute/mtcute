import Long from 'long'

import { parseFileId, tdFileId as td } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { parseMarkedPeerId } from '../../utils/peer-utils.js'

import FileType = td.FileType
import { getPlatform } from '../../platform.js'
import { assertNever } from '../../types/utils.js'

const EMPTY_BUFFER = new Uint8Array(0)

type FileId = td.RawFullRemoteFileLocation

function dialogPhotoToInputPeer(
    dialog: td.RawPhotoSizeSourceDialogPhoto | td.RawPhotoSizeSourceDialogPhotoLegacy,
): tl.TypeInputPeer {
    const markedPeerId = dialog.id
    const [peerType, peerId] = parseMarkedPeerId(markedPeerId)

    if (peerType === 'user') {
        return {
            _: 'inputPeerUser',
            userId: peerId,
            accessHash: dialog.accessHash,
        }
    } else if (peerType === 'chat') {
        return {
            _: 'inputPeerChat',
            chatId: peerId,
        }
    }

    return {
        _: 'inputPeerChannel',
        channelId: peerId,
        accessHash: dialog.accessHash,
    }
}

/**
 * Convert a file ID or {@link tdFileId.RawFullRemoteFileLocation}
 * to TL object `inputWebFileLocation`
 *
 * @param fileId  File ID, either parsed or as a string
 */
export function fileIdToInputWebFileLocation(fileId: string | FileId): tl.RawInputWebFileLocation {
    if (typeof fileId === 'string') fileId = parseFileId(getPlatform(), fileId)

    if (fileId.location._ !== 'web') {
        throw new td.ConversionError('inputWebFileLocation')
    }

    return {
        _: 'inputWebFileLocation',
        url: fileId.location.url,
        accessHash: fileId.location.accessHash,
    }
}

/**
 * Convert a file ID or {@link tdFileId.RawFullRemoteFileLocation}
 * to TL object representing an `InputFileLocation`
 *
 * @param fileId  File ID, either parsed or as a string
 */
export function fileIdToInputFileLocation(fileId: string | FileId): tl.TypeInputFileLocation {
    if (typeof fileId === 'string') fileId = parseFileId(getPlatform(), fileId)

    const loc = fileId.location

    switch (loc._) {
        case 'web':
            throw new td.ConversionError('InputFileLocation')

        case 'photo': {
            switch (loc.source._) {
                case 'legacy':
                    if (!fileId.fileReference) {
                        throw new td.InvalidFileIdError('Expected legacy photo to have file reference')
                    }

                    // for some reason tdlib removed this thing altogether
                    // https://github.com/tdlib/td/commit/4bb76a7b6f47bf9e0d0d01a72aac579ec73557ee#diff-8cc4f7c60a8261a8cf782e7fb51b95105bfb08710a1c2b63f80a48263ae0fb9bL401
                    // still leaving this, but not sure if passing 0 as volume_id and local_id is correct at all lol
                    return {
                        _: 'inputPhotoLegacyFileLocation',
                        fileReference: fileId.fileReference,
                        id: loc.id,
                        accessHash: loc.accessHash,
                        volumeId: Long.ZERO,
                        localId: 0,
                        secret: loc.source.secret,
                    }
                case 'thumbnail':
                    if (!fileId.fileReference) {
                        throw new td.InvalidFileIdError('Expected thumbnail photo to have file reference')
                    }

                    if (loc.source.fileType !== FileType.Photo && loc.source.fileType !== FileType.Thumbnail) {
                        throw new td.InvalidFileIdError('Expected a thumbnail to have a correct file type')
                    }

                    return {
                        _:
                            loc.source.fileType === FileType.Photo ?
                                'inputPhotoFileLocation' :
                                'inputDocumentFileLocation',
                        fileReference: fileId.fileReference,
                        id: loc.id,
                        accessHash: loc.accessHash,
                        thumbSize: loc.source.thumbnailType,
                    }
                case 'dialogPhoto':
                    return {
                        _: 'inputPeerPhotoFileLocation',
                        big: loc.source.big,
                        peer: dialogPhotoToInputPeer(loc.source),
                        photoId: loc.id,
                    }
                case 'stickerSetThumbnail':
                    // this was also removed from tdlib:
                    // https://github.com/tdlib/td/commit/4bb76a7b6f47bf9e0d0d01a72aac579ec73557ee#diff-8cc4f7c60a8261a8cf782e7fb51b95105bfb08710a1c2b63f80a48263ae0fb9bR432
                    // also leaving this one though.
                    return {
                        _: 'inputStickerSetThumb',
                        stickerset: {
                            _: 'inputStickerSetID',
                            id: loc.source.id,
                            accessHash: loc.source.accessHash,
                        },
                        thumbVersion: 0,
                    }
                case 'fullLegacy':
                    if (!fileId.fileReference) {
                        throw new td.InvalidFileIdError('Expected legacy photo to have file reference')
                    }

                    return {
                        _: 'inputPhotoLegacyFileLocation',
                        fileReference: fileId.fileReference,
                        id: loc.id,
                        accessHash: loc.accessHash,
                        volumeId: loc.source.volumeId,
                        localId: loc.source.localId,
                        secret: loc.source.secret,
                    }
                case 'dialogPhotoLegacy':
                    return {
                        _: 'inputPeerPhotoFileLocationLegacy',
                        big: loc.source.big,
                        peer: dialogPhotoToInputPeer(loc.source),
                        volumeId: loc.source.volumeId,
                        localId: loc.source.localId,
                    }
                case 'stickerSetThumbnailLegacy':
                    return {
                        _: 'inputStickerSetThumbLegacy',
                        stickerset: {
                            _: 'inputStickerSetID',
                            id: loc.source.id,
                            accessHash: loc.source.accessHash,
                        },
                        volumeId: loc.source.volumeId,
                        localId: loc.source.localId,
                    }
                case 'stickerSetThumbnailVersion':
                    return {
                        _: 'inputStickerSetThumb',
                        stickerset: {
                            _: 'inputStickerSetID',
                            id: loc.source.id,
                            accessHash: loc.source.accessHash,
                        },
                        thumbVersion: loc.source.version,
                    }
                default:
                    assertNever(loc.source)
            }

            throw new td.ConversionError('inputFileLocation')
        }
        case 'common': {
            if (!fileId.fileReference) {
                throw new td.InvalidFileIdError('Expected common to have file reference')
            }

            if (fileId.type === FileType.Encrypted) {
                return {
                    _: 'inputEncryptedFileLocation',
                    id: loc.id,
                    accessHash: loc.accessHash,
                }
            } else if (fileId.type === FileType.Secure || fileId.type === FileType.SecureRaw) {
                return {
                    _: 'inputSecureFileLocation',
                    id: loc.id,
                    accessHash: loc.accessHash,
                }
            }

            return {
                _: 'inputDocumentFileLocation',
                fileReference: fileId.fileReference,
                id: loc.id,
                accessHash: loc.accessHash,
                thumbSize: '',
            }
        }
        default:
            assertNever(loc)
    }
}

/**
 * Convert a file ID or {@link tdFileId.RawFullRemoteFileLocation}
 * to TL object `inputDocument`
 *
 * @param fileId  File ID, either parsed or as a string
 */
export function fileIdToInputDocument(fileId: string | FileId): tl.RawInputDocument {
    if (typeof fileId === 'string') fileId = parseFileId(getPlatform(), fileId)

    if (
        fileId.location._ !== 'common' ||
        fileId.type === FileType.Secure ||
        fileId.type === FileType.SecureRaw ||
        fileId.type === FileType.Encrypted
    ) {
        throw new td.ConversionError('inputDocument')
    }

    let fileRef = fileId.fileReference

    if (!fileRef) {
        if (fileId.type === FileType.Sticker) {
            // older stickers' file IDs don't have file ref
            fileRef = EMPTY_BUFFER
        } else {
            throw new td.InvalidFileIdError('Expected document to have file reference')
        }
    }

    return {
        _: 'inputDocument',
        fileReference: fileRef,
        id: fileId.location.id,
        accessHash: fileId.location.accessHash,
    }
}

/**
 * Convert a file ID or {@link tdFileId.RawFullRemoteFileLocation}
 * to TL object `inputPhoto`
 *
 * @param fileId  File ID, either parsed or as a string
 */
export function fileIdToInputPhoto(fileId: string | FileId): tl.RawInputPhoto {
    if (typeof fileId === 'string') fileId = parseFileId(getPlatform(), fileId)

    if (fileId.location._ !== 'photo') {
        throw new td.ConversionError('inputPhoto')
    }

    if (!fileId.fileReference) {
        throw new td.InvalidFileIdError('Expected photo to have file reference')
    }

    return {
        _: 'inputPhoto',
        fileReference: fileId.fileReference,
        id: fileId.location.id,
        accessHash: fileId.location.accessHash,
    }
}

/**
 * Convert a file ID or {@link tdFileId.RawFullRemoteFileLocation}
 * to TL object `inputEncryptedFile`
 *
 * @param fileId  File ID, either parsed or as a string
 */
export function fileIdToEncryptedFile(fileId: string | FileId): tl.RawInputEncryptedFile {
    if (typeof fileId === 'string') fileId = parseFileId(getPlatform(), fileId)

    if (fileId.location._ !== 'common' || fileId.type !== FileType.Encrypted) {
        throw new td.ConversionError('inputEncryptedFile')
    }

    return {
        _: 'inputEncryptedFile',
        id: fileId.location.id,
        accessHash: fileId.location.accessHash,
    }
}

/**
 * Convert a file ID or {@link tdFileId.RawFullRemoteFileLocation}
 * to TL object `inputSecureFile`
 *
 * @param fileId  File ID, either parsed or as a string
 */
export function fileIdToSecureFile(fileId: string | FileId): tl.RawInputSecureFile {
    if (typeof fileId === 'string') fileId = parseFileId(getPlatform(), fileId)

    if (fileId.location._ !== 'common' || (fileId.type !== FileType.Secure && fileId.type !== FileType.SecureRaw)) {
        throw new td.ConversionError('inputSecureFile')
    }

    return {
        _: 'inputSecureFile',
        id: fileId.location.id,
        accessHash: fileId.location.accessHash,
    }
}
