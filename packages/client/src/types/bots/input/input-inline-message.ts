import { tl } from '@mtcute/tl'
import { BotKeyboard, ReplyMarkup } from '../keyboards'
import { TelegramClient } from '../../../client'

export interface InputInlineMessageText {
    type: 'text'

    /**
     * Text of the message
     */
    text: string

    /**
     * Text markup entities.
     * If passed, parse mode is ignored
     */
    entities?: tl.TypeMessageEntity[]

    /**
     * Message reply markup
     */
    replyMarkup?: ReplyMarkup

    /**
     * Whether to disable links preview in this message
     */
    disableWebPreview?: boolean
}

export type InputInlineMessage =
    | InputInlineMessageText

export namespace BotInlineMessage {
    export function text (
        text: string,
        params?: Omit<InputInlineMessageText, 'type' | 'text'>,
    ): InputInlineMessageText {
        return {
            type: 'text',
            text,
            ...(
                params || {}
            ),
        }
    }

    export async function _convertToTl (
        client: TelegramClient,
        obj: InputInlineMessage,
        parseMode?: string | null,
    ): Promise<tl.TypeInputBotInlineMessage> {
        if (obj.type === 'text') {
            const [message, entities] = await client['_parseEntities'](obj.text, parseMode, obj.entities)

            return {
                _: 'inputBotInlineMessageText',
                message,
                entities,
                replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup)
            }
        }

        return obj as never
    }
}
