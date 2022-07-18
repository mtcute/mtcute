import {
    ParsedUpdate,
    assertNever,
    User,
    Message,
    DeleteMessageUpdate,
    ChatMemberUpdate,
    InlineQuery,
    ChosenInlineResult,
    CallbackQuery,
    PollUpdate,
    PollVoteUpdate,
    UserStatusUpdate,
    BotStoppedUpdate,
    BotChatJoinRequestUpdate,
} from '@mtcute/client'
import { I18nValue } from './types'

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
    switch (update.constructor) {
        case Message:
            // if sender is Chat it will just be undefined
            return ((update as Message).sender as User).language
        case ChatMemberUpdate:
        case InlineQuery:
        case ChosenInlineResult:
        case CallbackQuery:
        case PollVoteUpdate:
        case BotStoppedUpdate:
        case BotChatJoinRequestUpdate:
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
