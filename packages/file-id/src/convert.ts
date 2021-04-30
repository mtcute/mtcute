import { tl } from '@mtcute/tl'
import { tdFileId, tdFileId as td } from './types'
import { parseFileId } from './parse'
import { getBasicPeerType, markedPeerIdToBare } from '@mtcute/core'
import FileType = tdFileId.FileType

type FileId = td.RawFullRemoteFileLocation

function dialogPhotoToInputPeer(
    dialog: td.RawPhotoSizeSourceDialogPhoto
): tl.TypeInputPeer {
    const markedPeerId = dialog.id.toJSNumber()
    const peerType = getBasicPeerType(markedPeerId)
    const peerId = markedPeerIdToBare(markedPeerId)

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
    } else {
        return {
            _: 'inputPeerChannel',
            channelId: peerId,
            accessHash: dialog.accessHash,
        }
    }
}

/**
 * Convert a file ID or {@link tdFileId.RawFullRemoteFileLocation}
 * to TL object `inputWebFileLocation`
 *
 * @param fileId  File ID, either parsed or as a string
 */
export function fileIdToInputWebFileLocation(
    fileId: string | FileId
): tl.RawInputWebFileLocation {
    if (typeof fileId === 'string') fileId = parseFileId(fileId)
    if (fileId.location._ !== 'web')
        throw new td.ConversionError('inputWebFileLocation')

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
export function fileIdToInputFileLocation(
    fileId: string | FileId
): tl.TypeInputFileLocation {
    if (typeof fileId === 'string') fileId = parseFileId(fileId)

    const loc = fileId.location
    switch (loc._) {
        case 'web':
            throw new td.ConversionError('InputFileLocation')
        case 'photo': {
            switch (loc.source._) {
                case 'legacy':
                    if (!fileId.fileReference)
                        throw new td.InvalidFileIdError(
                            'Expected legacy photo to have file reference'
                        )

                    return {
                        _: 'inputPhotoLegacyFileLocation',
                        fileReference: fileId.fileReference,
                        id: loc.id,
                        accessHash: loc.accessHash,
                        volumeId: loc.volumeId,
                        localId: loc.localId,
                        secret: loc.source.secret,
                    }
                case 'thumbnail':
                    if (!fileId.fileReference)
                        throw new td.InvalidFileIdError(
                            'Expected thumbnail photo to have file reference'
                        )

                    if (
                        loc.source.fileType !== FileType.Photo &&
                        loc.source.fileType !== FileType.Thumbnail
                    )
                        throw new td.InvalidFileIdError(
                            'Expected a thumbnail to have a correct file type'
                        )

                    return {
                        _:
                            loc.source.fileType === FileType.Photo
                                ? 'inputPhotoFileLocation'
                                : 'inputDocumentFileLocation',
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
                        volumeId: loc.volumeId,
                        localId: loc.localId,
                    }
                case 'stickerSetThumbnail':
                    return {
                        _: 'inputStickerSetThumb',
                        stickerset: {
                            _: 'inputStickerSetID',
                            id: loc.source.id,
                            accessHash: loc.source.accessHash,
                        },
                        volumeId: loc.volumeId,
                        localId: loc.localId,
                    }
            }

            throw new td.ConversionError('inputFileLocation')
        }
        case 'common': {
            if (!fileId.fileReference)
                throw new td.InvalidFileIdError(
                    'Expected common to have file reference'
                )

            if (fileId.type === FileType.Encrypted) {
                return {
                    _: 'inputEncryptedFileLocation',
                    id: loc.id,
                    accessHash: loc.accessHash,
                }
            } else if (
                fileId.type === FileType.Secure ||
                fileId.type === FileType.SecureRaw
            ) {
                return {
                    _: 'inputSecureFileLocation',
                    id: loc.id,
                    accessHash: loc.accessHash,
                }
            } else {
                return {
                    _: 'inputDocumentFileLocation',
                    fileReference: fileId.fileReference,
                    id: loc.id,
                    accessHash: loc.accessHash,
                    thumbSize: '',
                }
            }
        }
    }
}

/**
 * Convert a file ID or {@link tdFileId.RawFullRemoteFileLocation}
 * to TL object `inputDocument`
 *
 * @param fileId  File ID, either parsed or as a string
 */
export function fileIdToInputDocument(
    fileId: string | FileId
): tl.RawInputDocument {
    if (typeof fileId === 'string') fileId = parseFileId(fileId)
    if (
        fileId.location._ !== 'common' ||
        fileId.type === FileType.Secure ||
        fileId.type === FileType.SecureRaw ||
        fileId.type === FileType.Encrypted
    )
        throw new td.ConversionError('inputDocument')

    if (!fileId.fileReference)
        throw new td.InvalidFileIdError(
            'Expected document to have file reference'
        )

    return {
        _: 'inputDocument',
        fileReference: fileId.fileReference,
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
    if (typeof fileId === 'string') fileId = parseFileId(fileId)
    if (fileId.location._ !== 'photo')
        throw new td.ConversionError('inputPhoto')

    if (!fileId.fileReference)
        throw new td.InvalidFileIdError('Expected photo to have file reference')

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
export function fileIdToEncryptedFile(
    fileId: string | FileId
): tl.RawInputEncryptedFile {
    if (typeof fileId === 'string') fileId = parseFileId(fileId)
    if (fileId.location._ !== 'common' || fileId.type !== FileType.Encrypted)
        throw new td.ConversionError('inputEncryptedFile')

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
export function fileIdToSecureFile(
    fileId: string | FileId
): tl.RawInputSecureFile {
    if (typeof fileId === 'string') fileId = parseFileId(fileId)
    if (
        fileId.location._ !== 'common' ||
        (fileId.type !== FileType.Secure && fileId.type !== FileType.SecureRaw)
    )
        throw new td.ConversionError('inputSecureFile')

    return {
        _: 'inputSecureFile',
        id: fileId.location.id,
        accessHash: fileId.location.accessHash,
    }
}