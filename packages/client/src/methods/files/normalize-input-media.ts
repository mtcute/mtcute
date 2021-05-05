import { TelegramClient } from '../../client'
import {
    InputMediaLike,
    isUploadedFile,
    MtCuteArgumentError,
    UploadFileLike,
} from '../../types'
import { tl } from '@mtcute/tl'
import {
    fileIdToInputDocument,
    fileIdToInputPhoto,
    parseFileId,
    tdFileId,
} from '@mtcute/file-id'
import { extractFileName } from '../../utils/file-utils'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * Normalize an {@link InputMediaLike} to `InputMedia`,
 * uploading the file if needed.
 *
 * @internal
 */
export async function _normalizeInputMedia(
    this: TelegramClient,
    media: InputMediaLike,
    params: {
        progressCallback?: (uploaded: number, total: number) => void
    },
    uploadMedia = false
): Promise<tl.TypeInputMedia> {
    // my condolences to those poor souls who are going to maintain this (myself included)

    // thanks to @pacificescape for pointing out messages.uploadMedia method

    if (tl.isAnyInputMedia(media)) return media

    let inputFile: tl.TypeInputFile | undefined = undefined
    let thumb: tl.TypeInputFile | undefined = undefined
    let mime = 'application/octet-stream'

    const upload = async (file: UploadFileLike): Promise<void> => {
        const uploaded = await this.uploadFile({
            file,
            progressCallback: params.progressCallback,
            fileName: media.fileName,
            fileMime:
                media.type === 'sticker'
                    ? media.isAnimated
                        ? 'application/x-tgsticker'
                        : 'image/webp'
                    : media.fileMime,
            fileSize: media.fileSize,
        })
        inputFile = uploaded.inputFile
        mime = uploaded.mime
    }

    const input = media.file
    if (tdFileId.isFileIdLike(input)) {
        if (typeof input === 'string' && input.match(/^https?:\/\//)) {
            return {
                _:
                    media.type === 'photo'
                        ? 'inputMediaPhotoExternal'
                        : 'inputMediaDocumentExternal',
                url: input,
            }
        } else if (typeof input === 'string' && input.match(/^file:/)) {
            await upload(input.substr(5))
        } else {
            const parsed =
                typeof input === 'string' ? parseFileId(input) : input

            if (parsed.location._ === 'photo') {
                return {
                    _: 'inputMediaPhoto',
                    id: fileIdToInputPhoto(parsed),
                }
            } else if (parsed.location._ === 'web') {
                return {
                    _:
                        parsed.type === tdFileId.FileType.Photo
                            ? 'inputMediaPhotoExternal'
                            : 'inputMediaDocumentExternal',
                    url: parsed.location.url,
                }
            } else {
                return {
                    _: 'inputMediaDocument',
                    id: fileIdToInputDocument(parsed),
                }
            }
        }
    } else if (typeof input === 'object' && tl.isAnyInputMedia(input)) {
        return input
    } else if (isUploadedFile(input)) {
        inputFile = input.inputFile
        mime = input.mime
    } else if (typeof input === 'object' && tl.isAnyInputFile(input)) {
        inputFile = input
    } else {
        await upload(input)
    }

    if (!inputFile) throw new Error('should not happen')

    if (media.type === 'photo') {
        const ret: tl.RawInputMediaUploadedPhoto = {
            _: 'inputMediaUploadedPhoto',
            file: inputFile,
            ttlSeconds: media.ttlSeconds,
        }
        if (!uploadMedia) return ret

        const res = await this.call({
            _: 'messages.uploadMedia',
            peer: { _: 'inputPeerSelf' },
            media: ret
        })

        assertTypeIs('normalizeInputMedia (@ messages.uploadMedia)', res, 'messageMediaPhoto')
        assertTypeIs('normalizeInputMedia (@ messages.uploadMedia)', res.photo!, 'photo')

        return {
            _: 'inputMediaPhoto',
            id: {
                _: 'inputPhoto',
                id: res.photo.id,
                accessHash: res.photo.accessHash,
                fileReference: res.photo.fileReference
            },
            ttlSeconds: media.ttlSeconds
        }
    }

    if ('thumb' in media && media.thumb) {
        thumb = await this._normalizeInputFile(media.thumb, {})
    }

    const attributes: tl.TypeDocumentAttribute[] = []

    if (media.type !== 'voice') {
        attributes.push({
            _: 'documentAttributeFilename',
            fileName:
                media.fileName ||
                (typeof media.file === 'string'
                    ? extractFileName(media.file)
                    : 'unnamed'),
        })
    }

    if (media.type === 'video') {
        attributes.push({
            _: 'documentAttributeVideo',
            duration: media.duration || 0,
            w: media.width || 0,
            h: media.height || 0,
            supportsStreaming: media.supportsStreaming,
            roundMessage: media.isRound,
        })
        if (media.isAnimated)
            attributes.push({ _: 'documentAttributeAnimated' })
    }

    if (media.type === 'audio' || media.type === 'voice') {
        attributes.push({
            _: 'documentAttributeAudio',
            voice: media.type === 'voice',
            duration: media.duration || 0,
            title: media.type === 'audio' ? media.title : undefined,
            performer: media.type === 'audio' ? media.performer : undefined,
            waveform: media.type === 'voice' ? media.waveform : undefined,
        })
    }

    if (media.type === 'sticker') {
        attributes.push({
            _: 'documentAttributeSticker',
            stickerset: {
                _: 'inputStickerSetEmpty',
            },
            alt: media.alt ?? '',
        })
    }

    const ret: tl.RawInputMediaUploadedDocument = {
        _: 'inputMediaUploadedDocument',
        nosoundVideo: media.type === 'video' && media.isAnimated,
        forceFile: media.type === 'document',
        file: inputFile,
        thumb,
        mimeType: mime,
        attributes,
        ttlSeconds: media.ttlSeconds
    }

    if (!uploadMedia) return ret

    const res = await this.call({
        _: 'messages.uploadMedia',
        peer: { _: 'inputPeerSelf' },
        media: ret
    })

    assertTypeIs('normalizeInputMedia (@ messages.uploadMedia)', res, 'messageMediaDocument')
    assertTypeIs('normalizeInputMedia (@ messages.uploadMedia)', res.document!, 'document')

    return {
        _: 'inputMediaDocument',
        id: {
            _: 'inputDocument',
            id: res.document.id,
            accessHash: res.document.accessHash,
            fileReference: res.document.fileReference
        },
        ttlSeconds: media.ttlSeconds
    }
}
