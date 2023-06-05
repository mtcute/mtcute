import type { BotChatJoinRequestUpdate, BotStoppedUpdate, CallbackQuery, ChatMemberUpdate, ChosenInlineResult, InlineQuery, Message, ParsedUpdate, PollVoteUpdate, User } from '@mtcute/client'

import { I18nStrings, I18nValue } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any

try {
    client = require('@mtcute/client')
} catch (e) {}

/**
 * Create an index of i18n strings delimited by "."
 *
 * @param strings  Strings object
 */
export function createI18nStringsIndex(
    strings: I18nStrings,
): Record<string, I18nValue> {
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
 * Extract language from `@mtcute/client` update. Can be used for customized
 * adapters or external i18n libraries.
 *
 * @param update  Update to extract language from
 */
export function extractLanguageFromUpdate(
    update: ParsedUpdate['data'],
): string | null | undefined {
    if (!client) {
        throw new Error(
            '@mtcute/client is not installed, you must provide your own adapter',
        )
    }

    switch (update.constructor) {
        case client.Message:
            // if sender is Chat it will just be undefined
            return ((update as Message).sender as User).language
        case client.ChatMemberUpdate:
        case client.InlineQuery:
        case client.ChosenInlineResult:
        case client.CallbackQuery:
        case client.PollVoteUpdate:
        case client.BotStoppedUpdate:
        case client.BotChatJoinRequestUpdate:
            return (
                update as
                    | ChatMemberUpdate
                    | InlineQuery
                    | ChosenInlineResult
                    | CallbackQuery
                    | PollVoteUpdate
                    | BotStoppedUpdate
                    | BotChatJoinRequestUpdate
            ).user.language
    }

    return null
}
