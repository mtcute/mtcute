import { TelegramClient } from '../../client'
import { BotKeyboard, InputPeerLike, Message, ReplyMarkup } from '../../types'
import { tl } from '@mtcute/tl'
import { normalizeToInputPeer } from '../../utils/peer-utils'

/**
 * Edit message text and/or reply markup.
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param message  Message or its ID
 * @param params
 * @internal
 */
export async function editMessage(
    this: TelegramClient,
    chatId: InputPeerLike,
    message: number | Message,
    params: {
        /**
         * New message text
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
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * Whether to disable links preview in this message
         */
        disableWebPreview?: boolean

        /**
         * For bots: inline or reply markup or an instruction
         * to hide a reply keyboard or to force a reply.
         */
        replyMarkup?: ReplyMarkup
    }
): Promise<Message> {
    const [content, entities] = await this._parseEntities(
        params.text,
        params.parseMode,
        params.entities
    )

    const res = await this.call({
        _: 'messages.editMessage',
        id: typeof message === 'number' ? message : message.id,
        peer: normalizeToInputPeer(await this.resolvePeer(chatId)),
        noWebpage: params.disableWebPreview,
        replyMarkup: BotKeyboard._convertToTl(params.replyMarkup),
        message: content,
        entities,
    })

    return this._findMessageInUpdate(res, true) as any
}
