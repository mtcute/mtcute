import { TelegramClient } from '../../client'
import { MtClientError, IMessageEntityParser } from '../../types'

/**
 * Register a given {@link IMessageEntityParser} as a parse mode
 * for messages. When this method is first called, given parse
 * mode is also set as default.
 *
 * @param parseMode  Parse mode to register
 * @throws MtClientError  When the parse mode with a given name is already registered.
 * @internal
 */
export function registerParseMode(
    this: TelegramClient,
    parseMode: IMessageEntityParser
): void {
    const name = parseMode.name

    if (name in this._parseModes) {
        throw new MtClientError(
            `Parse mode ${name} is already registered. Unregister it first!`
        )
    }
    this._parseModes[name] = parseMode

    if (!this._defaultParseMode) {
        this._defaultParseMode = name
    }
}

/**
 * Unregister a parse mode by its name.
 * Will silently fail if given parse mode does not exist.
 *
 * Also updates the default parse mode to the next one available, if any
 *
 * @param name  Name of the parse mode to unregister
 * @internal
 */
export function unregisterParseMode(this: TelegramClient, name: string): void {
    delete this._parseModes[name]

    if (this._defaultParseMode === name) {
        this._defaultParseMode = Object.keys(this._defaultParseMode)[0] ?? null
    }
}

/**
 * Get a {@link IMessageEntityParser} registered under a given name (or a default one).
 *
 * @param name  Name of the parse mode which parser to get.
 * @throws MtClientError  When the provided parse mode is not registered
 * @throws MtClientError  When `name` is omitted and there is no default parse mode
 * @internal
 */
export function getParseMode(
    this: TelegramClient,
    name?: string | null
): IMessageEntityParser {
    if (!name) {
        if (!this._defaultParseMode)
            throw new MtClientError('There is no default parse mode')

        name = this._defaultParseMode
    }

    if (!(name in this._parseModes)) {
        throw new MtClientError(`Parse mode ${name} is not registered.`)
    }

    return this._parseModes[name]
}

/**
 * Set a given parse mode as a default one.
 *
 * @param name  Name of the parse mode
 * @throws MtClientError  When given parse mode is not registered.
 * @internal
 */
export function setDefaultParseMode(this: TelegramClient, name: string): void {
    if (!(name in this._parseModes)) {
        throw new MtClientError(`Parse mode ${name} is not registered.`)
    }

    this._defaultParseMode = name
}
