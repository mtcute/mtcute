import { BaseTelegramClient, MtArgumentError } from '@mtcute/core'

import { IMessageEntityParser } from '../../types'
import { getParseModesState } from './_state'

/**
 * Register a given {@link IMessageEntityParser} as a parse mode
 * for messages. When this method is first called, given parse
 * mode is also set as default.
 *
 * @param parseMode  Parse mode to register
 * @throws MtClientError  When the parse mode with a given name is already registered.
 */
export function registerParseMode(client: BaseTelegramClient, parseMode: IMessageEntityParser): void {
    const name = parseMode.name

    const state = getParseModesState(client)

    if (state.parseModes.has(name)) {
        throw new MtArgumentError(`Parse mode ${name} is already registered. Unregister it first!`)
    }
    state.parseModes.set(name, parseMode)

    if (!state.defaultParseMode) {
        state.defaultParseMode = name
    }
}

/**
 * Unregister a parse mode by its name.
 * Will silently fail if given parse mode does not exist.
 *
 * Also updates the default parse mode to the next one available, if any
 *
 * @param name  Name of the parse mode to unregister
 */
export function unregisterParseMode(client: BaseTelegramClient, name: string): void {
    const state = getParseModesState(client)

    state.parseModes.delete(name)

    if (state.defaultParseMode === name) {
        const [first] = state.parseModes.keys()
        state.defaultParseMode = first ?? null
    }
}

/**
 * Get a {@link IMessageEntityParser} registered under a given name (or a default one).
 *
 * @param name  Name of the parse mode which parser to get.
 * @throws MtClientError  When the provided parse mode is not registered
 * @throws MtClientError  When `name` is omitted and there is no default parse mode
 */
export function getParseMode(client: BaseTelegramClient, name?: string | null): IMessageEntityParser {
    const state = getParseModesState(client)

    if (!name) {
        if (!state.defaultParseMode) {
            throw new MtArgumentError('There is no default parse mode')
        }

        name = state.defaultParseMode
    }

    const mode = state.parseModes.get(name)

    if (!mode) {
        throw new MtArgumentError(`Parse mode ${name} is not registered.`)
    }

    return mode
}

/**
 * Set a given parse mode as a default one.
 *
 * @param name  Name of the parse mode
 * @throws MtClientError  When given parse mode is not registered.
 */
export function setDefaultParseMode(client: BaseTelegramClient, name: string): void {
    const state = getParseModesState(client)

    if (!state.parseModes.has(name)) {
        throw new MtArgumentError(`Parse mode ${name} is not registered.`)
    }

    state.defaultParseMode = name
}
