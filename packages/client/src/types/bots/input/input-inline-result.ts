import { tl } from '@mtcute/tl'
import { BotInlineMessage, InputInlineMessage } from './input-inline-message'
import { TelegramClient } from '../../../client'

interface BaseInputInlineResult {
    /**
     * Unique ID of the result
     */
    id: string

    /**
     * Message to send when the result is selected.
     *
     * By default, is automatically generated,
     * and details about how it is generated can be found
     * in subclasses' description
     */
    message?: InputInlineMessage
}

/**
 * Represents an input article.
 *
 * If `message` is not provided, a {@link InputInlineMessageText} is created
 * with web preview enabled and text generated as follows:
 * ```
 * {{#if url}}
 * <a href="{{url}}"><b>{{title}}</b></a>
 * {{else}}
 * <b>{{title}}</b>
 * {{/if}}
 * {{#if description}}
 * {{description}}
 * {{/if}}
 * ```
 * > Handlebars syntax is used. HTML tags are used to signify entities,
 * > but in fact raw TL entity objects are created
 */
export interface InputInlineResultArticle extends BaseInputInlineResult {
    type: 'article'

    /**
     * Title of the result (must not be empty)
     */
    title: string

    /**
     * Description of the result
     */
    description?: string

    /**
     * URL of the article
     */
    url?: string

    /**
     * Whether to prevent article URL from
     * displaying by the client
     *
     * Defaults to `false`
     */
    hideUrl?: boolean

    /**
     * Article thumbnail URL (only jpeg).
     */
    thumb?: string | tl.RawInputWebDocument
}

export type InputInlineResult = InputInlineResultArticle

export namespace BotInline {
    export function article(
        params: Omit<InputInlineResultArticle, 'type'>
    ): InputInlineResultArticle {
        return {
            type: 'article',
            ...params,
        }
    }

    export async function _convertToTl(
        client: TelegramClient,
        obj: InputInlineResult,
        parseMode?: string | null
    ): Promise<tl.TypeInputBotInlineResult> {
        if (obj.type === 'article') {
            let sendMessage: tl.TypeInputBotInlineMessage
            if (obj.message) {
                sendMessage = await BotInlineMessage._convertToTl(client, obj.message, parseMode)
            } else {
                let message = obj.title
                const entities: tl.TypeMessageEntity[] = [
                    {
                        _: 'messageEntityBold',
                        offset: 0,
                        length: message.length
                    }
                ]

                if (obj.url) {
                    entities.push({
                        _: 'messageEntityTextUrl',
                        url: obj.url,
                        offset: 0,
                        length: message.length
                    })
                }

                if (obj.description) {
                    message += '\n' + obj.description
                }

                sendMessage = {
                    _: 'inputBotInlineMessageText',
                    message,
                    entities
                }
            }

            return {
                _: 'inputBotInlineResult',
                id: obj.id,
                type: obj.type,
                title: obj.title,
                description: obj.description,
                url: obj.hideUrl ? undefined : obj.url,
                content: obj.url && obj.hideUrl ? {
                    _: 'inputWebDocument',
                    url: obj.url,
                    mimeType: 'text/html',
                    size: 0,
                    attributes: []
                } : undefined,
                thumb: typeof obj.thumb === 'string' ? {
                    _: 'inputWebDocument',
                    size: 0,
                    url: obj.thumb,
                    mimeType: 'image/jpeg',
                    attributes: [],
                } : obj.thumb,
                sendMessage
            }
        }

        return obj as never
    }
}
