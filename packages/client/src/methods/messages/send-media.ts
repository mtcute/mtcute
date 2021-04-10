import { TelegramClient } from '../../client'
import {
    BotKeyboard,
    InputMediaLike,
    InputPeerLike,
    isUploadedFile,
    Message,
    MtCuteArgumentError,
    ReplyMarkup,
} from '../../types'
import { tl } from '@mtcute/tl'
import { extractFileName } from '../../utils/file-utils'
import { normalizeToInputPeer } from '../../utils/peer-utils'
import { normalizeDate, randomUlong } from '../../utils/misc-utils'

/**
 * Send a single media.
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param media  Media contained in the message
 * @param params  Additional sending parameters
 * @internal
 */
export async function sendMedia(
    this: TelegramClient,
    chatId: InputPeerLike,
    media: InputMediaLike,
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
    }
): Promise<Message> {
    if (!params) params = {}

    if (media.type === 'photo') {
        return this.sendPhoto(chatId, media.file, {
            caption: media.caption,
            entities: media.entities,
            ...params,
        })
    }

    let inputMedia: tl.TypeInputMedia | null = null

    let inputFile: tl.TypeInputFile | undefined = undefined
    let thumb: tl.TypeInputFile | undefined = undefined
    let mime = 'application/octet-stream'

    const input = media.file
    if (typeof input === 'string' && input.match(/^https?:\/\//)) {
        inputMedia = {
            _: 'inputMediaDocumentExternal',
            url: input,
        }
    } else if (isUploadedFile(input)) {
        inputFile = input.inputFile
        mime = input.mime
    } else if (typeof input === 'object' && tl.isAnyInputFile(input)) {
        inputFile = input
    } else {
        const uploaded = await this.uploadFile({
            file: input,
            fileName: media.fileName,
            progressCallback: params.progressCallback,
        })
        inputFile = uploaded.inputFile
        mime = uploaded.mime
    }

    if (!inputMedia) {
        if (!inputFile) throw new Error('should not happen')

        if ('thumb' in media && media.thumb) {
            const t = media.thumb
            if (typeof t === 'string' && t.match(/^https?:\/\//)) {
                throw new MtCuteArgumentError("Thumbnail can't be external")
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
                roundMessage: media.isRound
            })
            if (media.isAnimated) attributes.push({ _: 'documentAttributeAnimated' })
        }

        if (media.type === 'audio' || media.type === 'voice') {
            attributes.push({
                _: 'documentAttributeAudio',
                voice: media.type === 'voice',
                duration: media.duration || 0,
                title: media.type === 'audio' ? media.title : undefined,
                performer: media.type === 'audio' ? media.performer : undefined,
                waveform: media.type === 'voice' ? media.waveform : undefined
            })
        }

        inputMedia = {
            _: 'inputMediaUploadedDocument',
            nosoundVideo: media.type === 'video' && media.isAnimated,
            forceFile: media.type === 'document',
            file: inputFile,
            thumb,
            mimeType: mime,
            attributes
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
    })

    return this._findMessageInUpdate(res)
}
