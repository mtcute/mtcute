import type {
    BusinessCallbackQuery,
    CallbackQuery,
    ChosenInlineResult,
    InlineCallbackQuery,
    InlineQuery,
} from '@mtcute/core'
import type { UpdateContextDistributed } from '../context/base.js'

import type { UpdateFilter } from './types.js'

import {
    BusinessMessage,
    Message,
} from '@mtcute/core'

type UpdatesWithText =
  | Message
  | BusinessMessage
  | UpdateContextDistributed<
    | InlineQuery
    | ChosenInlineResult
    | CallbackQuery
    | InlineCallbackQuery
    | BusinessCallbackQuery
  >

function extractText(obj: UpdatesWithText): string | null {
    if (obj instanceof Message || obj instanceof BusinessMessage) {
        return obj.text
    }

    switch (obj._name) {
        case 'inline_query':
            return obj.query
        case 'chosen_inline_result':
            return obj.id
        case 'callback_query':
        case 'inline_callback_query':
        case 'business_callback_query':
            if (obj.raw.data) return obj.dataStr
    }

    return null
}

/**
 * Filter objects that match a given regular expression
 *  - for `Message`, `Message.text` is used
 *  - for `InlineQuery`, `InlineQuery.query` is used
 *  - for {@link ChosenInlineResult}, {@link ChosenInlineResult#id} is used
 *  - for callback queries, `dataStr` is used
 *
 * When a regex matches, the match array is stored in a
 * type-safe extension field `.match` of the object
 *
 * @param regex  Regex to be matched
 */
export function regex(regex: RegExp): UpdateFilter<UpdatesWithText, { match: RegExpMatchArray }> {
    return (obj) => {
        const txt = extractText(obj)
        if (!txt) return false

        const m = txt.match(regex)

        if (m) {
            (obj as typeof obj & { match: RegExpMatchArray }).match = m

            return true
        }

        return false
    }
}

/**
 * Filter objects which contain the exact text given
 *  - for `Message`, `Message.text` is used
 *  - for `InlineQuery`, `InlineQuery.query` is used
 *  - for {@link ChosenInlineResult}, {@link ChosenInlineResult.id} is used
 *  - for callback queries, `dataStr` is used
 *
 * @param str  String to be matched
 * @param ignoreCase  Whether string case should be ignored
 */
export function equals(str: string, ignoreCase = false): UpdateFilter<UpdatesWithText> {
    if (ignoreCase) {
        str = str.toLowerCase()

        return obj => extractText(obj)?.toLowerCase() === str
    }

    return obj => extractText(obj) === str
}

/**
 * Filter objects which contain the text given (as a substring)
 *  - for `Message`, `Message.text` is used
 *  - for `InlineQuery`, `InlineQuery.query` is used
 *  - for {@link ChosenInlineResult}, {@link ChosenInlineResult.id} is used
 *  - for callback queries, `dataStr` is used
 *
 * @param str  Substring to be matched
 * @param ignoreCase  Whether string case should be ignored
 */
export function contains(str: string, ignoreCase = false): UpdateFilter<UpdatesWithText> {
    if (ignoreCase) {
        str = str.toLowerCase()

        return (obj) => {
            const txt = extractText(obj)

            return txt != null && txt.toLowerCase().includes(str)
        }
    }

    return (obj) => {
        const txt = extractText(obj)

        return txt != null && txt.includes(str)
    }
}

/**
 * Filter objects which contain the text starting with a given string
 *  - for `Message`, `Message.text` is used
 *  - for `InlineQuery`, `InlineQuery.query` is used
 *  - for {@link ChosenInlineResult}, {@link ChosenInlineResult.id} is used
 *  - for callback queries, `dataStr` is used
 *
 * @param str  Substring to be matched
 * @param ignoreCase  Whether string case should be ignored
 */
export function startsWith(str: string, ignoreCase = false): UpdateFilter<UpdatesWithText> {
    if (ignoreCase) {
        str = str.toLowerCase()

        return (obj) => {
            const txt = extractText(obj)

            return txt != null && txt.toLowerCase().substring(0, str.length) === str
        }
    }

    return (obj) => {
        const txt = extractText(obj)

        return txt != null && txt.substring(0, str.length) === str
    }
}

/**
 * Filter objects which contain the text ending with a given string
 *  - for `Message`, `Message.text` is used
 *  - for `InlineQuery`, `InlineQuery.query` is used
 *  - for {@link ChosenInlineResult}, {@link ChosenInlineResult.id} is used
 *  - for callback queries, `dataStr` is used
 *
 * @param str  Substring to be matched
 * @param ignoreCase  Whether string case should be ignored
 */
export function endsWith(str: string, ignoreCase = false): UpdateFilter<UpdatesWithText> {
    if (ignoreCase) {
        str = str.toLowerCase()

        return (obj) => {
            const txt = extractText(obj)

            return txt != null && txt.toLowerCase().substring(0, str.length) === str
        }
    }

    return (obj) => {
        const txt = extractText(obj)

        return txt != null && txt.substring(0, str.length) === str
    }
}
