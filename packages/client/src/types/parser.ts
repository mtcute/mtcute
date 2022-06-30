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
     * Parser name, which will be used when registering it.
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
     * Add formatting to the text given the plain text and the entities.
     *
     * > **Note**: `unparse(parse(text)) === text` is not always true!
     *
     * @param text  Plain text
     * @param entities  Message entities that should be added to the text
     */
    unparse(text: string, entities: ReadonlyArray<MessageEntity>): string
}

/**
 * Raw string that will not be escaped when passing
 * to tagged template helpers (like `html` and `md`)
 */
export class FormattedString<T extends string = never> {
    /**
     * @param value  Value that the string holds
     * @param mode  Name of the parse mode used
     */
    constructor(readonly value: string, readonly mode?: T) {}

    toString(): string {
        return this.value
    }
}
