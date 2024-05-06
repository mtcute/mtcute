import Long from 'long'

import { parseFileId, tdFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { getPlatform } from '../../../platform.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { isUploadedFile } from '../../types/files/uploaded-file.js'
import { UploadFileLike } from '../../types/files/utils.js'
import { InputMediaLike } from '../../types/media/input-media/types.js'
import { inputTextToTl } from '../../types/misc/entities.js'
import { fileIdToInputDocument, fileIdToInputPhoto } from '../../utils/convert-file-id.js'
import { normalizeDate } from '../../utils/misc-utils.js'
import { encodeWaveform } from '../../utils/voice-utils.js'
import { _normalizeInputText } from '../misc/normalize-text.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _normalizeInputFile } from './normalize-input-file.js'
import { uploadFile } from './upload-file.js'

/**
 * Normalize an {@link InputMediaLike} to `InputMedia`,
 * uploading the file if needed.
 */
export async function _normalizeInputMedia(
    client: ITelegramClient,
    media: InputMediaLike,
    params: {
        progressCallback?: (uploaded: number, total: number) => void
        uploadPeer?: tl.TypeInputPeer
        businessConnectionId?: string
    } = {},
    uploadMedia = false,
): Promise<tl.TypeInputMedia> {
    // my condolences to those poor souls who are going to maintain this (myself included)

    // thanks to @pacificescape for pointing out messages.uploadMedia method

    if (tl.isAnyInputMedia(media)) {
        // make sure the peers in the media are correctly resolved (i.e. mtcute.* ones are replaced with proper ones)
        switch (media._) {
            case 'inputMediaStory':
                return {
                    ...media,
                    peer: await resolvePeer(client, media.peer),
                }
        }

        return media
    }

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
                typeof media.game === 'string' ?
                    {
                        _: 'inputGameShortName',
                        botId: { _: 'inputUserSelf' },
                        shortName: media.game,
                    } :
                    media.game,
        }
    }

    if (media.type === 'invoice') {
        return {
            _: 'inputMediaInvoice',
            title: media.title,
            description: media.description,
            photo:
                typeof media.photo === 'string' ?
                    {
                        _: 'inputWebDocument',
                        url: media.photo,
                        mimeType: 'image/jpeg',
                        size: 0,
                        attributes: [],
                    } :
                    media.photo,
            invoice: media.invoice,
            payload: media.payload,
            provider: media.token,
            providerData: {
                _: 'dataJSON',
                data: JSON.stringify(media.providerData),
            },
            startParam: media.startParam,
            extendedMedia: media.extendedMedia ?
                await _normalizeInputMedia(client, media.extendedMedia, params) :
                undefined,
        }
    }

    if (media.type === 'poll' || media.type === 'quiz') {
        const answers: tl.TypePollAnswer[] = media.answers.map((ans, idx) => {
            if (typeof ans === 'object' && tl.isAnyPollAnswer(ans)) return ans

            return {
                _: 'pollAnswer',
                text: inputTextToTl(ans),
                // emulate the behaviour of most implementations
                option: new Uint8Array([48 /* '0' */ + idx]),
            }
        })

        let correct: Uint8Array[] | undefined = undefined
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
                [solution, solutionEntities] = await _normalizeInputText(client, media.solution)
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
                question: inputTextToTl(media.question),
                answers,
                closePeriod: media.closePeriod,
                closeDate: normalizeDate(media.closeDate),
            },
            correctAnswers: correct,
            solution,
            solutionEntities,
        }
    }

    if (media.type === 'story') {
        return {
            _: 'inputMediaStory',
            peer: await resolvePeer(client, media.peer),
            id: media.id,
        }
    }

    if (media.type === 'webpage') {
        return {
            _: 'inputMediaWebPage',
            forceLargeMedia: media.size === 'large',
            forceSmallMedia: media.size === 'small',
            optional: !media.required,
            url: media.url,
        }
    }

    let inputFile: tl.TypeInputFile | undefined = undefined
    let thumb: tl.TypeInputFile | undefined = undefined
    let mime = 'application/octet-stream'

    const upload = async (file: UploadFileLike): Promise<void> => {
        let sendMime

        if (media.type === 'sticker') {
            sendMime = media.isAnimated ? 'application/x-tgsticker' : 'image/webp'
        } else {
            sendMime = media.fileMime
        }

        const uploaded = await uploadFile(client, {
            file,
            progressCallback: params.progressCallback,
            fileName: media.fileName,
            fileMime: sendMime,
            fileSize: media.fileSize,
            requireFileSize: media.type === 'photo',
        })
        inputFile = uploaded.inputFile
        mime = uploaded.mime
    }

    const uploadPeer = params.uploadPeer ?? { _: 'inputPeerSelf' }

    const uploadMediaIfNeeded = async (inputMedia: tl.TypeInputMedia, photo: boolean): Promise<tl.TypeInputMedia> => {
        if (!uploadMedia) return inputMedia

        const res = await client.call({
            _: 'messages.uploadMedia',
            peer: uploadPeer,
            media: inputMedia,
            businessConnectionId: params.businessConnectionId,
        })

        if (photo) {
            assertTypeIs('normalizeInputMedia (@ messages.uploadMedia)', res, 'messageMediaPhoto')
            assertTypeIs('normalizeInputMedia (@ messages.uploadMedia)', res.photo!, 'photo')

            return {
                _: 'inputMediaPhoto',
                id: {
                    _: 'inputPhoto',
                    id: res.photo.id,
                    accessHash: res.photo.accessHash,
                    fileReference: res.photo.fileReference,
                },
                ttlSeconds: media.ttlSeconds,
                spoiler: media.type === 'video' && media.spoiler,
            }
        }
        assertTypeIs('normalizeInputMedia (@ messages.uploadMedia)', res, 'messageMediaDocument')
        assertTypeIs('normalizeInputMedia (@ messages.uploadMedia)', res.document!, 'document')

        return {
            _: 'inputMediaDocument',
            id: {
                _: 'inputDocument',
                id: res.document.id,
                accessHash: res.document.accessHash,
                fileReference: res.document.fileReference,
            },
            ttlSeconds: media.ttlSeconds,
            spoiler: media.type === 'video' && media.spoiler,
        }
    }

    const input = media.file

    if (tdFileId.isFileIdLike(input)) {
        if (typeof input === 'string' && input.match(/^https?:\/\//)) {
            return uploadMediaIfNeeded(
                {
                    _: media.type === 'photo' ? 'inputMediaPhotoExternal' : 'inputMediaDocumentExternal',
                    url: input,
                },
                media.type === 'photo',
            )
        } else if (typeof input === 'string' && input.match(/^file:/)) {
            await upload(input.substring(5))
        } else {
            const parsed = typeof input === 'string' ? parseFileId(getPlatform(), input) : input

            if (parsed.location._ === 'photo') {
                return {
                    _: 'inputMediaPhoto',
                    id: fileIdToInputPhoto(parsed),
                }
            } else if (parsed.location._ === 'web') {
                return uploadMediaIfNeeded(
                    {
                        _:
                            parsed.type === tdFileId.FileType.Photo ?
                                'inputMediaPhotoExternal' :
                                'inputMediaDocumentExternal',
                        url: parsed.location.url,
                    },
                    parsed.type === tdFileId.FileType.Photo,
                )
            }

            return {
                _: 'inputMediaDocument',
                id: fileIdToInputDocument(parsed),
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
                spoiler: media.spoiler,
            },
            true,
        )
    }

    if ('thumb' in media && media.thumb) {
        thumb = await _normalizeInputFile(client, media.thumb, {})
    }

    const attributes: tl.TypeDocumentAttribute[] = []

    if (media.type !== 'voice') {
        attributes.push({
            _: 'documentAttributeFilename',
            fileName: media.fileName || inputFile.name,
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

        if (media.isAnimated) {
            attributes.push({ _: 'documentAttributeAnimated' })
        }
    }

    if (media.type === 'audio' || media.type === 'voice') {
        attributes.push({
            _: 'documentAttributeAudio',
            voice: media.type === 'voice',
            duration: media.duration || 0,
            title: media.type === 'audio' ? media.title : undefined,
            performer: media.type === 'audio' ? media.performer : undefined,
            waveform: media.type === 'voice' && media.waveform ? encodeWaveform(media.waveform) : undefined,
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
            spoiler: media.type === 'video' && media.spoiler,
        },
        false,
    )
}
