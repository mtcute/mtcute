import Long from 'long'
import { tl } from '@mtcute/tl'
import {
    fileIdToInputDocument,
    fileIdToInputPhoto,
    parseFileId,
    tdFileId,
} from '@mtcute/file-id'

import { TelegramClient } from '../../client'
import { InputMediaLike, isUploadedFile, UploadFileLike } from '../../types'
import { extractFileName } from '../../utils/file-utils'
import { assertTypeIs } from '../../utils/type-assertion'
import { normalizeDate } from '../../utils/misc-utils'
import { encodeWaveform } from '../../utils/voice-utils'

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
        parseMode?: string | null
        progressCallback?: (uploaded: number, total: number) => void
        uploadPeer?: tl.TypeInputPeer
    },
    uploadMedia = false
): Promise<tl.TypeInputMedia> {
    // my condolences to those poor souls who are going to maintain this (myself included)

    // thanks to @pacificescape for pointing out messages.uploadMedia method

    if (tl.isAnyInputMedia(media)) return media

    if (media.type === 'venue') {
        return {
            _: 'inputMediaVenue',
            geoPoint: {
                _: 'inputGeoPoint',
                lat: media.latitude,
                long: media.longitude,
            },
            title: media.title,
            address: media.address,
            provider: media.source?.provider ?? '',
            venueId: media.source?.id ?? '',
            venueType: media.source?.type ?? '',
        }
    }

    if (media.type === 'geo') {
        return {
            _: 'inputMediaGeoPoint',
            geoPoint: {
                _: 'inputGeoPoint',
                lat: media.latitude,
                long: media.longitude,
            },
        }
    }

    if (media.type === 'geo_live') {
        return {
            _: 'inputMediaGeoLive',
            geoPoint: {
                _: 'inputGeoPoint',
                lat: media.latitude,
                long: media.longitude,
            },
            stopped: media.stopped,
            heading: media.heading,
            period: media.period,
            proximityNotificationRadius: media.proximityNotificationRadius,
        }
    }

    if (media.type === 'dice') {
        return {
            _: 'inputMediaDice',
            emoticon: media.emoji,
        }
    }

    if (media.type === 'contact') {
        return {
            _: 'inputMediaContact',
            phoneNumber: media.phone,
            firstName: media.firstName,
            lastName: media.lastName ?? '',
            vcard: media.vcard ?? '',
        }
    }

    if (media.type === 'game') {
        return {
            _: 'inputMediaGame',
            id:
                typeof media.game === 'string'
                    ? {
                          _: 'inputGameShortName',
                          botId: { _: 'inputUserSelf' },
                          shortName: media.game,
                      }
                    : media.game,
        }
    }

    if (media.type === 'invoice') {
        return {
            _: 'inputMediaInvoice',
            title: media.title,
            description: media.description,
            photo:
                typeof media.photo === 'string'
                    ? {
                          _: 'inputWebDocument',
                          url: media.photo,
                          mimeType: 'image/jpeg',
                          size: 0,
                          attributes: [],
                      }
                    : media.photo,
            invoice: media.invoice,
            payload: media.payload,
            provider: media.token,
            providerData: {
                _: 'dataJSON',
                data: JSON.stringify(media.providerData),
            },
            startParam: media.startParam,
            extendedMedia: media.extendedMedia
                ? await this._normalizeInputMedia(media.extendedMedia, params)
                : undefined,
        }
    }

    if (media.type === 'poll' || media.type === 'quiz') {
        const answers: tl.TypePollAnswer[] = media.answers.map((ans, idx) => {
            if (typeof ans === 'string') {
                return {
                    _: 'pollAnswer',
                    text: ans,
                    // emulate the behaviour of most implementations
                    option: Buffer.from([48 /* '0' */ + idx]),
                }
            }

            return ans
        })

        let correct: Buffer[] | undefined = undefined
        let solution: string | undefined = undefined
        let solutionEntities: tl.TypeMessageEntity[] | undefined = undefined

        if (media.type === 'quiz') {
            let input = media.correct
            if (!Array.isArray(input)) input = [input]
            correct = input.map((it) => {
                if (typeof it === 'number') {
                    return answers[it].option
                }

                return it
            })

            if (media.solution) {
                ;[solution, solutionEntities] = await this._parseEntities(
                    media.solution,
                    params.parseMode,
                    media.solutionEntities
                )
            }
        }

        return {
            _: 'inputMediaPoll',
            poll: {
                _: 'poll',
                closed: media.closed,
                id: Long.ZERO,
                publicVoters: media.public,
                multipleChoice: media.multiple,
                quiz: media.type === 'quiz',
                question: media.question,
                answers,
                closePeriod: media.closePeriod,
                closeDate: normalizeDate(media.closeDate),
            },
            correctAnswers: correct,
            solution,
            solutionEntities,
        }
    }

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

    const uploadPeer = params.uploadPeer ?? { _: 'inputPeerSelf' }

    const uploadMediaIfNeeded = async (
        inputMedia: tl.TypeInputMedia,
        photo: boolean
    ): Promise<tl.TypeInputMedia> => {
        if (!uploadMedia) return inputMedia

        const res = await this.call({
            _: 'messages.uploadMedia',
            peer: uploadPeer,
            media: inputMedia,
        })

        if (photo) {
            assertTypeIs(
                'normalizeInputMedia (@ messages.uploadMedia)',
                res,
                'messageMediaPhoto'
            )
            assertTypeIs(
                'normalizeInputMedia (@ messages.uploadMedia)',
                res.photo!,
                'photo'
            )

            return {
                _: 'inputMediaPhoto',
                id: {
                    _: 'inputPhoto',
                    id: res.photo.id,
                    accessHash: res.photo.accessHash,
                    fileReference: res.photo.fileReference,
                },
                ttlSeconds: media.ttlSeconds,
            }
        } else {
            assertTypeIs(
                'normalizeInputMedia (@ messages.uploadMedia)',
                res,
                'messageMediaDocument'
            )
            assertTypeIs(
                'normalizeInputMedia (@ messages.uploadMedia)',
                res.document!,
                'document'
            )

            return {
                _: 'inputMediaDocument',
                id: {
                    _: 'inputDocument',
                    id: res.document.id,
                    accessHash: res.document.accessHash,
                    fileReference: res.document.fileReference,
                },
                ttlSeconds: media.ttlSeconds,
            }
        }
    }

    const input = media.file
    if (tdFileId.isFileIdLike(input)) {
        if (typeof input === 'string' && input.match(/^https?:\/\//)) {
            return uploadMediaIfNeeded(
                {
                    _:
                        media.type === 'photo'
                            ? 'inputMediaPhotoExternal'
                            : 'inputMediaDocumentExternal',
                    url: input,
                },
                media.type === 'photo'
            )
        } else if (typeof input === 'string' && input.match(/^file:/)) {
            await upload(input.substring(5))
        } else {
            const parsed =
                typeof input === 'string' ? parseFileId(input) : input

            if (parsed.location._ === 'photo') {
                return {
                    _: 'inputMediaPhoto',
                    id: fileIdToInputPhoto(parsed),
                }
            } else if (parsed.location._ === 'web') {
                return uploadMediaIfNeeded(
                    {
                        _:
                            parsed.type === tdFileId.FileType.Photo
                                ? 'inputMediaPhotoExternal'
                                : 'inputMediaDocumentExternal',
                        url: parsed.location.url,
                    },
                    parsed.type === tdFileId.FileType.Photo
                )
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
        return uploadMediaIfNeeded(
            {
                _: 'inputMediaUploadedPhoto',
                file: inputFile,
                ttlSeconds: media.ttlSeconds,
            },
            true
        )
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
            waveform:
                media.type === 'voice' && media.waveform
                    ? encodeWaveform(media.waveform)
                    : undefined,
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

    return uploadMediaIfNeeded(
        {
            _: 'inputMediaUploadedDocument',
            nosoundVideo: media.type === 'video' && media.isAnimated,
            forceFile: media.type === 'document',
            file: inputFile,
            thumb,
            mimeType: mime,
            attributes,
            ttlSeconds: media.ttlSeconds,
        },
        false
    )
}
