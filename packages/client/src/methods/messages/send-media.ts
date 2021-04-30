import { TelegramClient } from '../../client'
import {
    BotKeyboard,
    InputMediaLike,
    InputPeerLike,
    isUploadedFile,
    Message,
    MtCuteArgumentError,
    ReplyMarkup, UploadFileLike,
} from '../../types'
import { tl } from '@mtcute/tl'
import { extractFileName } from '../../utils/file-utils'
import { normalizeToInputPeer } from '../../utils/peer-utils'
import { normalizeDate, randomUlong } from '../../utils/misc-utils'
import {
    fileIdToInputDocument,
    fileIdToInputPhoto,
    parseFileId,
    tdFileId,
} from '@mtcute/file-id'

/**
 * Send a single media.
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param media
 *     Media contained in the message. You can also pass TDLib
 *     and Bot API compatible File ID, which will be wrapped
 *     in {@link InputMedia.auto}
 * @param params  Additional sending parameters
 * @internal
 */
export async function sendMedia(
    this: TelegramClient,
    chatId: InputPeerLike,
    media: InputMediaLike | string,
    params?: {
        /**
         * Message to reply to. Either a message object or message ID.
         */
        replyTo?: number | Message

        /**
         * Parse mode to use to parse entities before sending
         * the message. Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

        /**
         * Whether to send this message silently.
         */
        silent?: boolean

        /**
         * If set, the message will be scheduled to this date.
         * When passing a number, a UNIX time in ms is expected.
         */
        schedule?: Date | number

        /**
         * For bots: inline or reply markup or an instruction
         * to hide a reply keyboard or to force a reply.
         */
        replyMarkup?: ReplyMarkup

        /**
         * Function that will be called after some part has been uploaded.
         * Only used when a file that requires uploading is passed,
         * and not used when uploading a thumbnail.
         *
         * @param uploaded  Number of bytes already uploaded
         * @param total  Total file size
         */
        progressCallback?: (uploaded: number, total: number) => void

        /**
         * Whether to clear draft after sending this message.
         *
         * Defaults to `false`
         */
        clearDraft?: boolean
    }
): Promise<Message> {
    if (!params) params = {}

    if (typeof media === 'string') {
        media = {
            type: 'auto',
            file: media,
        }
    }

    if (media.type === 'photo') {
        return this.sendPhoto(chatId, media.file, {
            caption: media.caption,
            entities: media.entities,
            ...params,
        })
    }

    let inputMedia: tl.TypeInputMedia | null = null

    // my condolences to those poor souls who are going to maintain this (myself included)

    let inputFile: tl.TypeInputFile | undefined = undefined
    let thumb: tl.TypeInputFile | undefined = undefined
    let mime = 'application/octet-stream'

    const upload = async (media: InputMediaLike, file: UploadFileLike): Promise<void> => {
        const uploaded = await this.uploadFile({
            file,
            fileName: media.fileName,
            progressCallback: params!.progressCallback,
            fileMime:
                media.type === 'sticker'
                    ? media.isAnimated
                    ? 'application/x-tgsticker'
                    : 'image/webp'
                    : media.mime,
            fileSize: media.fileSize
        })
        inputFile = uploaded.inputFile
        mime = uploaded.mime
    }

    const input = media.file
    if (tdFileId.isFileIdLike(input)) {
        if (typeof input === 'string' && input.match(/^https?:\/\//)) {
            inputMedia = {
                _: 'inputMediaDocumentExternal',
                url: input,
            }
        } else if (typeof input === 'string' && input.match(/^file:/)) {
            await upload(media, input.substr(5))
        } else {
            const parsed =
                typeof input === 'string' ? parseFileId(input) : input

            if (parsed.location._ === 'photo') {
                inputMedia = {
                    _: 'inputMediaPhoto',
                    id: fileIdToInputPhoto(parsed),
                }
            } else if (parsed.location._ === 'web') {
                inputMedia = {
                    _:
                        parsed.type === tdFileId.FileType.Photo
                            ? 'inputMediaPhotoExternal'
                            : 'inputMediaDocumentExternal',
                    url: parsed.location.url,
                }
            } else {
                inputMedia = {
                    _: 'inputMediaDocument',
                    id: fileIdToInputDocument(parsed),
                }
            }
        }
    } else if (typeof input === 'object' && tl.isAnyInputMedia(input)) {
        inputMedia = input
    } else if (isUploadedFile(input)) {
        inputFile = input.inputFile
        mime = input.mime
    } else if (typeof input === 'object' && tl.isAnyInputFile(input)) {
        inputFile = input
    } else {
        await upload(media, input)
    }

    if (!inputMedia) {
        if (!inputFile) throw new Error('should not happen')

        if ('thumb' in media && media.thumb) {
            const t = media.thumb
            if (typeof t === 'object' && tl.isAnyInputMedia(t)) {
                throw new MtCuteArgumentError("Thumbnail can't be InputMedia")
            } else if (tdFileId.isFileIdLike(t)) {
                if (typeof t === 'string' && t.match(/^file:/)) {
                    const uploaded = await this.uploadFile({
                        file: t.substr(5),
                    })
                    thumb = uploaded.inputFile
                } else {
                    throw new MtCuteArgumentError(
                        "Thumbnail can't be a URL or a File ID"
                    )
                }
            } else if (isUploadedFile(t)) {
                thumb = t.inputFile
            } else if (typeof t === 'object' && tl.isAnyInputFile(t)) {
                thumb = t
            } else {
                const uploaded = await this.uploadFile({
                    file: t,
                })
                thumb = uploaded.inputFile
            }
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

        inputMedia = {
            _: 'inputMediaUploadedDocument',
            nosoundVideo: media.type === 'video' && media.isAnimated,
            forceFile: media.type === 'document',
            file: inputFile,
            thumb,
            mimeType: mime,
            attributes,
        }
    }

    const [message, entities] = await this._parseEntities(
        media.caption,
        params.parseMode,
        media.entities
    )

    const peer = normalizeToInputPeer(await this.resolvePeer(chatId))
    const replyMarkup = BotKeyboard._convertToTl(params.replyMarkup)

    const res = await this.call({
        _: 'messages.sendMedia',
        peer,
        media: inputMedia,
        silent: params.silent,
        replyToMsgId: params.replyTo
            ? typeof params.replyTo === 'number'
                ? params.replyTo
                : params.replyTo.id
            : undefined,
        randomId: randomUlong(),
        scheduleDate: normalizeDate(params.schedule),
        replyMarkup,
        message,
        entities,
        clearDraft: params.clearDraft,
    })

    return this._findMessageInUpdate(res)
}
