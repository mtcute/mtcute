import type * as dispatcherNs from '@mtcute/dispatcher'

import { I18nStrings, I18nValue } from './types.js'

/**
 * Create an index of i18n strings delimited by "."
 *
 * @param strings  Strings object
 */
export function createI18nStringsIndex(strings: I18nStrings): Record<string, I18nValue> {
    const ret: Record<string, I18nValue> = {}

    function add(obj: I18nStrings, prefix: string) {
        for (const key in obj) {
            const val = obj[key]

            if (typeof val === 'object' && !('value' in val)) {
                add(val, prefix + key + '.')
            } else {
                ret[prefix + key] = val as string
            }
        }
    }

    add(strings, '')

    return ret
}

/**
 * Extract language from `@mtcute/dispatcher` context.
 * Can be used for customized adapters or external i18n libraries.
 *
 * @param update  Update to extract language from
 */
export function extractLanguageFromUpdate(update: dispatcherNs.UpdateContextType): string | null | undefined {
    if (!('_name' in update)) return null

    switch (update._name) {
        case 'new_message': {
            const { sender } = update

            return sender.type === 'user' ? sender.language : null
        }
        case 'poll_vote': {
            const { peer } = update

            return peer?.type === 'user' ? peer.language : null
        }
        case 'chat_member':
        case 'inline_query':
        case 'chosen_inline_result':
        case 'callback_query':
        case 'bot_stopped':
        case 'bot_chat_join_request':
            return update.user.language
    }

    return null
}
