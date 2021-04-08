import { tl } from '@mtcute/tl'
import { MessageEntity } from '../types'

/**
 * Interface describing a message entity parser.
 * MTCute comes with HTML parser inside `@mtcute/html-parser`
 * and MarkdownV2 parser inside `@mtcute/markdown-parser`,
 * implemented similar to how they are described
 * in the [Bot API documentation](https://core.telegram.org/bots/api#formatting-options).
 *
 * You are also free to implement your own parser and register it with
 * {@link TelegramClient.registerParseMode}.
 */
export interface IMessageEntityParser {
    /**
     * Default name for the parser.
     *
     * Used when registering the parser as a fallback value for `name`
     */
    name: string

    /**
     * Parse a string containing some text with formatting to plain text
     * and message entities
     *
     * @param text  Formatted text
     * @returns  A tuple containing plain text and a list of entities
     */
    parse(text: string): [string, tl.TypeMessageEntity[]]

    /**
     * Add formating to the text given the plain text and the entities.
     *
     * **Note** that `unparse(parse(text)) === text` is not always true!
     *
     * @param text  Plain text
     * @param entities  Message entities that should be added to the text
     */
    unparse(text: string, entities: MessageEntity[]): string
}
