/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseTelegramClient } from '@mtcute/core'

import { IMessageEntityParser } from '../../types/index.js'

const STATE_SYMBOL = Symbol('parseModesState')

/** @internal */
export interface ParseModesState {
    parseModes: Map<string, IMessageEntityParser>
    defaultParseMode: string | null
}

/** @internal */
export function getParseModesState(client: BaseTelegramClient): ParseModesState {
    // eslint-disable-next-line
    return ((client as any)[STATE_SYMBOL] ??= {
        parseModes: new Map(),
        defaultParseMode: null,
    } satisfies ParseModesState)
}
