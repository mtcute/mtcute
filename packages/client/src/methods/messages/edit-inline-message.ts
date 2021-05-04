import { TelegramClient } from '../../client'
import { BotKeyboard, InputMediaLike, ReplyMarkup } from '../../types'
import { tl } from '@mtcute/tl'
import { parseInlineMessageId } from '../../utils/inline-utils'
import { TelegramConnection } from '@mtcute/core'

// @extension
interface EditInlineExtension {
    _connectionsForInline: Record<number, TelegramConnection>
}

// @initialize
function _initializeEditInline(this: TelegramClient) {
    this._connectionsForInline = {}
}

/**
 * Edit sent inline message text, media and reply markup.
 *
 * @param id
 *     Inline message ID, either as a TL object, or as a
 *     TDLib and Bot API compatible string
 * @param params
 * @internal
 */
export async function editInlineMessage(
    this: TelegramClient,
    id: tl.TypeInputBotInlineMessageID | string,
    params: {
        /**
         * New message text
         *
         * When `media` is passed, `media.caption` is used instead
         */
        text?: string

        /**
         * Parse mode to use to parse entities before sending
         * the message. Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

        /**
         * List of formatting entities to use instead of parsing via a
         * parse mode.
         *
         * **Note:** Passing this makes the method ignore {@link parseMode}
         *
         * When `media` is passed, `media.entities` is used instead
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * New message media
         */
        media?: InputMediaLike

        /**
         * Whether to disable links preview in this message
         */
        disableWebPreview?: boolean

        /**
         * For bots: new reply markup.
         * If omitted, existing markup will be removed.
         */
        replyMarkup?: ReplyMarkup

        /**
         * For media, upload progress callback.
         *
         * @param uploaded  Number of bytes uploaded
         * @param total  Total file size in bytes
         */
        progressCallback?: (uploaded: number, total: number) => void
    }
): Promise<void> {
    let content: string | undefined
    let entities: tl.TypeMessageEntity[] | undefined
    let media: tl.TypeInputMedia | undefined = undefined

    if (params.media) {
        media = await this._normalizeInputMedia(params.media, params)
        ;[content, entities] = await this._parseEntities(
            params.media.caption,
            params.parseMode,
            params.media.entities
        )
    } else {
        ;[content, entities] = await this._parseEntities(
            params.text,
            params.parseMode,
            params.entities
        )
    }

    if (typeof id === 'string') {
        id = parseInlineMessageId(id)
    }

    let connection = this.primaryConnection
    if (id.dcId !== connection.params.dc.id) {
        if (!(id.dcId in this._connectionsForInline)) {
            this._connectionsForInline[
                id.dcId
            ] = await this.createAdditionalConnection(id.dcId)
        }
        connection = this._connectionsForInline[id.dcId]
    }

    await this.call(
        {
            _: 'messages.editInlineBotMessage',
            id,
            noWebpage: params.disableWebPreview,
            replyMarkup: BotKeyboard._convertToTl(params.replyMarkup),
            message: content,
            entities,
            media,
        },
        { connection }
    )
}
