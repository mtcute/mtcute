import type { ParsedUpdate } from '@mtcute/client'
import { I18nValue } from './types'

let client: any
try {
    client = require('@mtcute/client')
} catch (e) {}

export function createI18nStringsIndex(
    strings: Record<string, any>
): Record<string, I18nValue> {
    const ret: Record<string, I18nValue> = {}

    function add(obj: Record<string, any>, prefix: string) {
        for (const key in obj) {
            const val = obj[key]

            if (typeof val === 'object') {
                add(val, prefix + key + '.')
            } else {
                ret[prefix + key] = val
            }
        }
    }

    add(strings, '')

    return ret
}

export function extractLanguageFromUpdate(
    update: ParsedUpdate['data']
): string | null | undefined {
    if (!client) {
        throw new Error(
            '@mtcute/client is not installed, you must provide your own adapter'
        )
    }

    const upd = update as any
    switch (upd.constructor) {
        case client.Message:
            // if sender is Chat it will just be undefined
            return upd.sender.language
        case client.ChatMemberUpdate:
        case client.InlineQuery:
        case client.ChosenInlineResult:
        case client.CallbackQuery:
        case client.PollVoteUpdate:
        case client.BotStoppedUpdate:
        case client.BotChatJoinRequestUpdate:
            return upd.user.language
    }

    return null
}
