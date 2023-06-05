/* eslint-disable @typescript-eslint/no-explicit-any */
// ^^ will be looked into in MTQ-29
import {
    Audio,
    BotChatJoinRequestUpdate,
    CallbackQuery,
    Chat,
    ChatMemberUpdate,
    ChatType,
    ChosenInlineResult,
    Contact,
    Dice,
    Document,
    Game,
    InlineQuery,
    Invoice,
    LiveLocation,
    Location,
    MaybeAsync,
    Message,
    MessageAction,
    Photo,
    Poll,
    PollVoteUpdate,
    RawDocument,
    RawLocation,
    Sticker,
    StickerSourceType,
    StickerType,
    User,
    UserStatus,
    UserStatusUpdate,
    UserTypingUpdate,
    Venue,
    Video,
    Voice,
    WebPage,
} from '@mtcute/client'
import { ChatMemberUpdateType } from '@mtcute/client/src/types/updates/chat-member-update'
import { MaybeArray } from '@mtcute/core'

import { UpdateState } from './state'

function extractText(
    obj: Message | InlineQuery | ChosenInlineResult | CallbackQuery,
): string | null {
    if (obj.constructor === Message) {
        return obj.text
    } else if (obj.constructor === InlineQuery) {
        return obj.query
    } else if (obj.constructor === ChosenInlineResult) {
        return obj.id
    } else if (obj.constructor === CallbackQuery) {
        if (obj.raw.data) return obj.dataStr
    }

    return null
}

/**
 * Type describing a primitive filter, which is a function taking some `Base`
 * and a {@link TelegramClient}, checking it against some condition
 * and returning a boolean.
 *
 * If `true` is returned, the filter is considered
 * to be matched, and the appropriate update handler function is called,
 * otherwise next registered handler is checked.
 *
 * Additionally, filter might contain a type modification
 * to `Base` for better code insights. If it is present,
 * it is used to overwrite types (!) of some of the `Base` fields
 * to given (note that this is entirely compile-time! object is not modified)
 *
 * For parametrized filters (like {@link filters.regex}),
 * type modification can also be used to add additional fields
 * (in case of `regex`, its match array is added to `.match`)
 *
 * Example without type mod:
 * ```typescript
 *
 * const hasPhoto: UpdateFilter<Message> = msg => msg.media?.type === 'photo'
 *
 * // ..later..
 * tg.onNewMessage(hasPhoto, async (msg) => {
 *     // `hasPhoto` filter matched, so we can safely assume
 *     // that `msg.media` is a Photo.
 *     //
 *     // but it is very redundant, verbose and error-rome,
 *     // wonder if we could make typescript do this automagically and safely...
 *     await (msg.media as Photo).downloadToFile(`${msg.id}.jpg`)
 * })
 * ```
 *
 * Example with type mod:
 * ```typescript
 *
 * const hasPhoto: UpdateFilter<Message, { media: Photo }> = msg => msg.media?.type === 'photo'
 *
 * // ..later..
 * tg.onNewMessage(hasPhoto, async (msg) => {
 *     // since `hasPhoto` filter matched,
 *     // we have applied the modification to `msg`,
 *     // and `msg.media` now has type `Photo`
 *     //
 *     // no more redundancy and type casts!
 *     await msg.media.downloadToFile(`${msg.id}.jpg`)
 * })
 * ```
 *
 * > **Note**: Type modification can contain anything, even totally unrelated types
 * > and it is *your* task to keep track that everything is correct.
 * >
 * > Bad example:
 * > ```typescript
 * > // we check for `Photo`, but type contains `Audio`. this will be a problem!
 * > const hasPhoto: UpdateFilter<Message, { media: Audio }> = msg => msg.media?.type === 'photo'
 * >
 * > // ..later..
 * > tg.onNewMessage(hasPhoto, async (msg) => {
 * >     // oops! `msg.media` is `Audio` and does not have `.width`!
 * >     console.log(msg.media.width)
 * > })
 * > ```
 *
 * > **Warning!** Do not use the generics provided in functions
 * > like `and`, `or`, etc. Those are meant to be inferred by the compiler!
 */
// we need the second parameter because it carries meta information
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types
export type UpdateFilter<Base, Mod = {}, State = never> = (
    update: Base,
    state?: UpdateState<State>
) => MaybeAsync<boolean>

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace filters {
    export type Modify<Base, Mod> = Omit<Base, keyof Mod> & Mod
    export type Invert<Base, Mod> = {
        [P in keyof Mod & keyof Base]: Exclude<Base[P], Mod[P]>
    }

    export type UnionToIntersection<U> = (
        U extends any ? (k: U) => void : never
    ) extends (k: infer I) => void
        ? I
        : never

    type ExtractBase<Filter> = Filter extends UpdateFilter<infer I, any>
        ? I
        : never

    type ExtractMod<Filter> = Filter extends UpdateFilter<any, infer I>
        ? I
        : never

    type ExtractState<Filter> = Filter extends UpdateFilter<any, any, infer I>
        ? I
        : never

    type TupleKeys<T extends any[]> = Exclude<keyof T, keyof []>
    type WrapBase<T extends any[]> = {
        [K in TupleKeys<T>]: { base: ExtractBase<T[K]> }
    }
    type Values<T> = T[keyof T]
    type UnwrapBase<T> = T extends { base: any } ? T['base'] : never
    type ExtractBaseMany<Filters extends any[]> = UnwrapBase<
        UnionToIntersection<Values<WrapBase<Filters>>>
    >

    /**
     * Invert a filter by applying a NOT logical operation:
     * `not(fn) = NOT fn`
     *
     * > **Note**: This also inverts type modification, i.e.
     * > if the base is `{ field: string | number | null }`
     * > and the modification is `{ field: string }`,
     * > then the negated filter will have
     * > inverted modification `{ field: number | null }`
     *
     * @param fn  Filter to negate
     */
    export function not<Base, Mod, State>(
        fn: UpdateFilter<Base, Mod, State>,
    ): UpdateFilter<Base, Invert<Base, Mod>, State> {
        return (upd, state) => {
            const res = fn(upd, state)

            if (typeof res === 'boolean') return !res

            return res.then((r) => !r)
        }
    }

    /**
     * Combine two filters by applying an AND logical operation:
     * `and(fn1, fn2) = fn1 AND fn2`
     *
     * > **Note**: This also combines type modifications, i.e.
     * > if the 1st has modification `{ field1: string }`
     * > and the 2nd has modification `{ field2: number }`,
     * > then the combined filter will have
     * > combined modification `{ field1: string, field2: number }`
     *
     * @param fn1  First filter
     * @param fn2  Second filter
     */
    export function and<Base, Mod1, Mod2, State1, State2>(
        fn1: UpdateFilter<Base, Mod1, State1>,
        fn2: UpdateFilter<Base, Mod2, State2>,
    ): UpdateFilter<Base, Mod1 & Mod2, State1 | State2> {
        return (upd, state) => {
            const res1 = fn1(upd, state as any)

            if (typeof res1 === 'boolean') {
                if (!res1) return false

                return fn2(upd, state as any)
            }

            return res1.then((r1) => {
                if (!r1) return false

                return fn2(upd, state as any)
            })
        }
    }

    /**
     * Combine two filters by applying an OR logical operation:
     * `or(fn1, fn2) = fn1 OR fn2`
     *
     * > **Note**: This also combines type modifications in a union, i.e.
     * > if the 1st has modification `{ field1: string }`
     * > and the 2nd has modification `{ field2: number }`,
     * > then the combined filter will have
     * > modification `{ field1: string } | { field2: number }`.
     * >
     * > It is up to the compiler to handle `if`s inside
     * > the handler function code, but this works with other
     * > logical functions as expected.
     *
     * @param fn1  First filter
     * @param fn2  Second filter
     */
    export function or<Base, Mod1, Mod2, State1, State2>(
        fn1: UpdateFilter<Base, Mod1, State1>,
        fn2: UpdateFilter<Base, Mod2, State2>,
    ): UpdateFilter<Base, Mod1 | Mod2, State1 | State2> {
        return (upd, state) => {
            const res1 = fn1(upd, state as any)

            if (typeof res1 === 'boolean') {
                if (res1) return true

                return fn2(upd, state as any)
            }

            return res1.then((r1) => {
                if (r1) return true

                return fn2(upd, state as any)
            })
        }
    }

    // im pretty sure it can be done simpler (return types of all and any),
    // so if you know how - PRs are welcome!

    /**
     * Combine multiple filters by applying an AND logical
     * operation between every one of them:
     * `every(fn1, fn2, ..., fnN) = fn1 AND fn2 AND ... AND fnN`
     *
     * > **Note**: This also combines type modification in a way
     * > similar to {@link and}.
     * >
     * > This method is less efficient than {@link and}
     *
     * > **Note**: This method *currently* does not propagate state
     * > type. This might be fixed in the future, but for now either
     * > use {@link and} or add type manually.
     *
     * @param fns  Filters to combine
     */
    export function every<Filters extends UpdateFilter<any, any>[]>(
        ...fns: Filters
    ): UpdateFilter<
        ExtractBaseMany<Filters>,
        UnionToIntersection<ExtractMod<Filters[number]>>
    > {
        if (fns.length === 2) return and(fns[0], fns[1])

        return (upd, state) => {
            let i = 0
            const max = fns.length

            const next = (): MaybeAsync<boolean> => {
                if (i === max) return true

                const res = fns[i++](upd, state)

                if (typeof res === 'boolean') {
                    if (!res) return false

                    return next()
                }

                return res.then((r: boolean) => {
                    if (!r) return false

                    return next()
                })
            }

            return next()
        }
    }

    /**
     * Combine multiple filters by applying an OR logical
     * operation between every one of them:
     * `every(fn1, fn2, ..., fnN) = fn1 OR fn2 OR ... OR fnN`
     *
     * > **Note**: This also combines type modification in a way
     * > similar to {@link or}.
     * >
     * > This method is less efficient than {@link or}
     *
     * > **Note**: This method *currently* does not propagate state
     * > type. This might be fixed in the future, but for now either
     * > use {@link or} or add type manually.
     *
     * @param fns  Filters to combine
     */
    export function some<Filters extends UpdateFilter<any, any, any>[]>(
        ...fns: Filters
    ): UpdateFilter<
        ExtractBaseMany<Filters>,
        ExtractMod<Filters[number]>,
        ExtractState<Filters[number]>
    > {
        if (fns.length === 2) return or(fns[0], fns[1])

        return (upd, state) => {
            let i = 0
            const max = fns.length

            const next = (): MaybeAsync<boolean> => {
                if (i === max) return false

                const res = fns[i++](upd, state)

                if (typeof res === 'boolean') {
                    if (res) return true

                    return next()
                }

                return res.then((r: boolean) => {
                    if (r) return true

                    return next()
                })
            }

            return next()
        }
    }

    /**
     * Filter that matches any update
     */
    export const any: UpdateFilter<any> = () => true

    /**
     * Filter messages generated by yourself (including Saved Messages)
     */
    export const me: UpdateFilter<Message, { sender: User }> = (msg) =>
        (msg.sender.constructor === User && msg.sender.isSelf) || msg.isOutgoing

    /**
     * Filter messages sent by bots
     */
    export const bot: UpdateFilter<Message, { sender: User }> = (msg) =>
        msg.sender.constructor === User && msg.sender.isBot

    /**
     * Filter messages by chat type
     */
    export const chat =
        <T extends ChatType>(
            type: T,
        ): UpdateFilter<
            Message,
            {
                chat: Modify<Chat, { type: T }>
                sender: T extends 'private' | 'bot' | 'group'
                    ? User
                    : User | Chat
            }
        > =>
            (msg) =>
                msg.chat.type === type

    /**
     * Filter updates by chat ID(s) or username(s)
     */
    export const chatId = (
        id: MaybeArray<number | string>,
    ): UpdateFilter<Message> => {
        if (Array.isArray(id)) {
            const index: Record<number | string, true> = {}
            let matchSelf = false
            id.forEach((id) => {
                if (id === 'me' || id === 'self') {
                    matchSelf = true
                } else {
                    index[id] = true
                }
            })

            return (msg) =>
                (matchSelf && msg.chat.isSelf) ||
                msg.chat.id in index ||

                msg.chat.username! in index
        }

        if (id === 'me' || id === 'self') {
            return (msg) => msg.chat.isSelf
        }

        if (typeof id === 'string') {
            return (msg) => msg.chat.username === id
        }

        return (msg) => msg.chat.id === id
    }

    /**
     * Filter updates by user ID(s) or username(s)
     *
     * Usernames are not supported for UserStatusUpdate
     * and UserTypingUpdate.
     *
     *
     * For chat member updates, uses `user.id`
     */
    export const userId = (
        id: MaybeArray<number | string>,
    ): UpdateFilter<
        | Message
        | UserStatusUpdate
        | UserTypingUpdate
        | InlineQuery
        | ChatMemberUpdate
        | ChosenInlineResult
        | CallbackQuery
        | PollVoteUpdate
        | BotChatJoinRequestUpdate
    > => {
        if (Array.isArray(id)) {
            const index: Record<number | string, true> = {}
            let matchSelf = false
            id.forEach((id) => {
                if (id === 'me' || id === 'self') {
                    matchSelf = true
                } else {
                    index[id] = true
                }
            })

            return (upd) => {
                const ctor = upd.constructor

                if (ctor === Message) {
                    const sender = (upd as Message).sender

                    return (
                        (matchSelf && sender.isSelf) ||
                        sender.id in index ||

                        sender.username! in index
                    )
                } else if (
                    ctor === UserStatusUpdate ||
                    ctor === UserTypingUpdate
                ) {
                    const id = (upd as UserStatusUpdate | UserTypingUpdate)
                        .userId

                    return (
                        // eslint-disable-next-line dot-notation
                        (matchSelf && id === upd.client['_userId']) ||
                        id in index
                    )
                }
                const user = (
                        upd as Exclude<
                            typeof upd,
                            Message | UserStatusUpdate | UserTypingUpdate
                        >
                ).user

                return (
                    (matchSelf && user.isSelf) ||
                        user.id in index ||

                        user.username! in index
                )
            }
        }

        if (id === 'me' || id === 'self') {
            return (upd) => {
                const ctor = upd.constructor

                if (ctor === Message) {
                    return (upd as Message).sender.isSelf
                } else if (
                    ctor === UserStatusUpdate ||
                    ctor === UserTypingUpdate
                ) {
                    return (
                        (upd as UserStatusUpdate | UserTypingUpdate).userId ===
                        // eslint-disable-next-line dot-notation
                        upd.client['_userId']
                    )
                }

                return (
                        upd as Exclude<
                            typeof upd,
                            Message | UserStatusUpdate | UserTypingUpdate
                        >
                ).user.isSelf
            }
        }

        if (typeof id === 'string') {
            return (upd) => {
                const ctor = upd.constructor

                if (ctor === Message) {
                    return (upd as Message).sender.username === id
                } else if (
                    ctor === UserStatusUpdate ||
                    ctor === UserTypingUpdate
                ) {
                    // username is not available
                    return false
                }

                return (
                    (
                            upd as Exclude<
                                typeof upd,
                                Message | UserStatusUpdate | UserTypingUpdate
                            >
                    ).user.username === id
                )
            }
        }

        return (upd) => {
            const ctor = upd.constructor

            if (ctor === Message) {
                return (upd as Message).sender.id === id
            } else if (ctor === UserStatusUpdate || ctor === UserTypingUpdate) {
                return (
                    (upd as UserStatusUpdate | UserTypingUpdate).userId === id
                )
            }

            return (
                (
                        upd as Exclude<
                            typeof upd,
                            Message | UserStatusUpdate | UserTypingUpdate
                        >
                ).user.id === id
            )
        }
    }

    /**
     * Filter incoming messages.
     *
     * Messages sent to yourself (i.e. Saved Messages) are also "incoming"
     */
    export const incoming: UpdateFilter<Message, { isOutgoing: false }> = (
        msg,
    ) => !msg.isOutgoing

    /**
     * Filter outgoing messages.
     *
     * Messages sent to yourself (i.e. Saved Messages) are **not** "outgoing"
     */
    export const outgoing: UpdateFilter<Message, { isOutgoing: true }> = (
        msg,
    ) => msg.isOutgoing

    /**
     * Filter messages that are replies to some other message
     */
    export const reply: UpdateFilter<Message, { replyToMessageId: number }> = (
        msg,
    ) => msg.replyToMessageId !== null

    /**
     * Filter messages containing some media
     */
    export const media: UpdateFilter<
        Message,
        { media: Exclude<Message['media'], null> }
    > = (msg) => msg.media !== null

    /**
     * Filter text-only messages non-service messages
     */
    export const text: UpdateFilter<
        Message,
        {
            media: null
            isService: false
        }
    > = (msg) => msg.media === null && !msg.isService

    /**
     * Filter service messages
     */
    export const service: UpdateFilter<Message, { isService: true }> = (msg) =>
        msg.isService

    /**
     * Filter service messages by action type
     */
    export const action = <T extends Exclude<MessageAction, null>['type']>(
        type: MaybeArray<T>,
    ): UpdateFilter<
        Message,
        {
            action: Extract<MessageAction, { type: T }>
            sender: T extends
                | 'user_joined_link'
                | 'user_removed'
                | 'history_cleared'
                | 'contact_joined'
                | 'bot_allowed'
                ? User
                : User | Chat
        }
    > => {
        if (Array.isArray(type)) {
            const index: Partial<Record<T, true>> = {}
            type.forEach((it) => (index[it] = true))

            return (msg) => (msg.action?.type as any) in index
        }

        return (msg) => msg.action?.type === type
    }

    /**
     * Filter messages containing a photo
     */
    export const photo: UpdateFilter<Message, { media: Photo }> = (msg) =>
        msg.media?.type === 'photo'

    /**
     * Filter messages containing a dice
     */
    export const dice: UpdateFilter<Message, { media: Dice }> = (msg) =>
        msg.media?.type === 'dice'

    /**
     * Filter messages containing a contact
     */
    export const contact: UpdateFilter<Message, { media: Contact }> = (msg) =>
        msg.media?.type === 'contact'

    /**
     * Filter messages containing a document
     *
     * This will also match media like audio, video, voice
     * that also use Documents
     */
    export const anyDocument: UpdateFilter<Message, { media: RawDocument }> = (
        msg,
    ) => msg.media instanceof RawDocument

    /**
     * Filter messages containing a document in form of a file
     *
     * This will not match media like audio, video, voice
     */
    export const document: UpdateFilter<Message, { media: Document }> = (msg) =>
        msg.media?.type === 'document'

    /**
     * Filter messages containing an audio file
     */
    export const audio: UpdateFilter<Message, { media: Audio }> = (msg) =>
        msg.media?.type === 'audio'

    /**
     * Filter messages containing a voice note
     */
    export const voice: UpdateFilter<Message, { media: Voice }> = (msg) =>
        msg.media?.type === 'voice'

    /**
     * Filter messages containing a sticker
     */
    export const sticker: UpdateFilter<Message, { media: Sticker }> = (msg) =>
        msg.media?.type === 'sticker'

    /**
     * Filter messages containing a sticker by its type
     */
    export const stickerByType =
        (type: StickerType): UpdateFilter<Message, { media: Sticker }> =>
            (msg) =>
                msg.media?.type === 'sticker' && msg.media.stickerType === type

    /**
     * Filter messages containing a sticker by its source file type
     */
    export const stickerBySourceType =
        (type: StickerSourceType): UpdateFilter<Message, { media: Sticker }> =>
            (msg) =>
                msg.media?.type === 'sticker' && msg.media.sourceType === type

    /**
     * Filter messages containing a video.
     *
     * This includes videos, round messages and animations
     */
    export const anyVideo: UpdateFilter<Message, { media: Video }> = (msg) =>
        msg.media?.type === 'video'

    /**
     * Filter messages containing a simple video.
     *
     * This does not include round messages and animations
     */
    export const video: UpdateFilter<
        Message,
        {
            media: Modify<
                Video,
                {
                    isRound: false
                    isAnimation: false
                }
            >
        }
    > = (msg) =>
        msg.media?.type === 'video' &&
        !msg.media.isAnimation &&
        !msg.media.isRound

    /**
     * Filter messages containing an animation.
     *
     * > **Note**: Legacy GIFs (i.e. documents with `image/gif` MIME)
     * > are also considered animations.
     */
    export const animation: UpdateFilter<
        Message,
        {
            media: Modify<
                Video,
                {
                    isRound: false
                    isAnimation: true
                }
            >
        }
    > = (msg) =>
        msg.media?.type === 'video' &&
        msg.media.isAnimation &&
        !msg.media.isRound

    /**
     * Filter messages containing a round message (aka video note).
     */
    export const roundMessage: UpdateFilter<
        Message,
        {
            media: Modify<
                Video,
                {
                    isRound: true
                    isAnimation: false
                }
            >
        }
    > = (msg) =>
        msg.media?.type === 'video' &&
        !msg.media.isAnimation &&
        msg.media.isRound

    /**
     * Filter messages containing any location (live or static).
     */
    export const anyLocation: UpdateFilter<Message, { media: Location }> = (
        msg,
    ) => msg.media instanceof RawLocation

    /**
     * Filter messages containing a static (non-live) location.
     */
    export const location: UpdateFilter<Message, { media: LiveLocation }> = (
        msg,
    ) => msg.media?.type === 'location'

    /**
     * Filter messages containing a live location.
     */
    export const liveLocation: UpdateFilter<
        Message,
        { media: LiveLocation }
    > = (msg) => msg.media?.type === 'live_location'

    /**
     * Filter messages containing a game.
     */
    export const game: UpdateFilter<Message, { media: Game }> = (msg) =>
        msg.media?.type === 'game'

    /**
     * Filter messages containing a webpage preview.
     */
    export const webpage: UpdateFilter<Message, { media: WebPage }> = (msg) =>
        msg.media?.type === 'web_page'

    /**
     * Filter messages containing a venue.
     */
    export const venue: UpdateFilter<Message, { media: Venue }> = (msg) =>
        msg.media?.type === 'venue'

    /**
     * Filter messages containing a poll.
     */
    export const poll: UpdateFilter<Message, { media: Poll }> = (msg) =>
        msg.media?.type === 'poll'

    /**
     * Filter messages containing an invoice.
     */
    export const invoice: UpdateFilter<Message, { media: Invoice }> = (msg) =>
        msg.media?.type === 'invoice'

    /**
     * Filter objects that match a given regular expression
     *  - for `Message`, `Message.text` is used
     *  - for `InlineQuery`, `InlineQuery.query` is used
     *  - for {@link ChosenInlineResult}, {@link ChosenInlineResult.id} is used
     *  - for `CallbackQuery`, `CallbackQuery.dataStr` is used
     *
     * When a regex matches, the match array is stored in a
     * type-safe extension field `.match` of the object
     *
     * @param regex  Regex to be matched
     */
    export const regex =
        (
            regex: RegExp,
        ): UpdateFilter<
            Message | InlineQuery | ChosenInlineResult | CallbackQuery,
            { match: RegExpMatchArray }
        > =>
            (obj) => {
                const txt = extractText(obj)
                if (!txt) return false

                const m = txt.match(regex)

                if (m) {
                    (obj as any).match = m

                    return true
                }

                return false
            }

    /**
     * Filter objects which contain the exact text given
     *  - for `Message`, `Message.text` is used
     *  - for `InlineQuery`, `InlineQuery.query` is used
     *  - for {@link ChosenInlineResult}, {@link ChosenInlineResult.id} is used
     *  - for `CallbackQuery`, `CallbackQuery.dataStr` is used
     *
     * @param str  String to be matched
     * @param ignoreCase  Whether string case should be ignored
     */
    export const equals = (
        str: string,
        ignoreCase = false,
    ): UpdateFilter<
        Message | InlineQuery | ChosenInlineResult | CallbackQuery
    > => {
        if (ignoreCase) {
            str = str.toLowerCase()

            return (obj) => extractText(obj)?.toLowerCase() === str
        }

        return (obj) => extractText(obj) === str
    }

    /**
     * Filter objects which contain the text given (as a substring)
     *  - for `Message`, `Message.text` is used
     *  - for `InlineQuery`, `InlineQuery.query` is used
     *  - for {@link ChosenInlineResult}, {@link ChosenInlineResult.id} is used
     *  - for `CallbackQuery`, `CallbackQuery.dataStr` is used
     *
     * @param str  Substring to be matched
     * @param ignoreCase  Whether string case should be ignored
     */
    export const contains = (
        str: string,
        ignoreCase = false,
    ): UpdateFilter<
        Message | InlineQuery | ChosenInlineResult | CallbackQuery
    > => {
        if (ignoreCase) {
            str = str.toLowerCase()

            return (obj) => {
                const txt = extractText(obj)

                return txt != null && txt.toLowerCase().indexOf(str) > -1
            }
        }

        return (obj) => {
            const txt = extractText(obj)

            return txt != null && txt.indexOf(str) > -1
        }
    }

    /**
     * Filter objects which contain the text starting with a given string
     *  - for `Message`, `Message.text` is used
     *  - for `InlineQuery`, `InlineQuery.query` is used
     *  - for {@link ChosenInlineResult}, {@link ChosenInlineResult.id} is used
     *  - for `CallbackQuery`, `CallbackQuery.dataStr` is used
     *
     * @param str  Substring to be matched
     * @param ignoreCase  Whether string case should be ignored
     */
    export const startsWith = (
        str: string,
        ignoreCase = false,
    ): UpdateFilter<
        Message | InlineQuery | ChosenInlineResult | CallbackQuery
    > => {
        if (ignoreCase) {
            str = str.toLowerCase()

            return (obj) => {
                const txt = extractText(obj)

                return (
                    txt != null &&
                    txt.toLowerCase().substring(0, str.length) === str
                )
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
     *  - for `CallbackQuery`, `CallbackQuery.dataStr` is used
     *
     * @param str  Substring to be matched
     * @param ignoreCase  Whether string case should be ignored
     */
    export const endsWith = (
        str: string,
        ignoreCase = false,
    ): UpdateFilter<
        Message | InlineQuery | ChosenInlineResult | CallbackQuery
    > => {
        if (ignoreCase) {
            str = str.toLowerCase()

            return (obj) => {
                const txt = extractText(obj)

                return (
                    txt != null &&
                    txt.toLowerCase().substring(0, str.length) === str
                )
            }
        }

        return (obj) => {
            const txt = extractText(obj)

            return txt != null && txt.substring(0, str.length) === str
        }
    }

    /**
     * Filter messages that call the given command(s)..
     *
     * When a command matches, the match array is stored in a
     * type-safe extension field `.commmand` of the {@link Message} object.
     * First element is the command itself, then the arguments.
     *
     * If the matched command was a RegExp, the first element is the
     * command, then the groups from the command regex, then the arguments.
     *
     * @param commands  Command(s) the filter should look for (w/out prefix)
     * @param prefixes
     *   Prefix(es) the filter should look for (default: `/`).
     *   Can be `null` to disable prefixes altogether
     * @param caseSensitive
     */
    export const command = (
        commands: MaybeArray<string | RegExp>,
        prefixes: MaybeArray<string> | null = '/',
        caseSensitive = false,
    ): UpdateFilter<Message, { command: string[] }> => {
        if (!Array.isArray(commands)) commands = [commands]

        commands = commands.map((i) =>
            typeof i === 'string' ? i.toLowerCase() : i,
        )

        const argumentsRe = /(["'])(.*?)(?<!\\)\1|(\S+)/g
        const unescapeRe = /\\(['"])/
        const commandsRe: RegExp[] = []
        commands.forEach((cmd) => {
            if (typeof cmd !== 'string') cmd = cmd.source

            commandsRe.push(
                new RegExp(
                    `^(${cmd})(?:\\s|$|@([a-zA-Z0-9_]+?bot)(?:\\s|$))`,
                    caseSensitive ? '' : 'i',
                ),
            )
        })

        if (prefixes === null) prefixes = []
        if (typeof prefixes === 'string') prefixes = [prefixes]

        const _prefixes = prefixes

        const check = (msg: Message): MaybeAsync<boolean> => {
            for (const pref of _prefixes) {
                if (!msg.text.startsWith(pref)) continue

                const withoutPrefix = msg.text.slice(pref.length)

                for (const regex of commandsRe) {
                    const m = withoutPrefix.match(regex)
                    if (!m) continue

                    const lastGroup = m[m.length - 1]

                    // eslint-disable-next-line dot-notation
                    if (lastGroup && msg.client['_isBot']) {
                        // check bot username
                        // eslint-disable-next-line dot-notation
                        if (lastGroup !== msg.client['_selfUsername']) { return false }
                    }

                    const match = m.slice(1, -1)

                    // we use .replace to iterate over global regex, not to replace the text
                    withoutPrefix
                        .slice(m[0].length)
                        .replace(argumentsRe, ($0, $1, $2, $3) => {
                            match.push(
                                ($2 || $3 || '').replace(unescapeRe, '$1'),
                            )

                            return ''
                        })
                    ;(msg as Message & { command: string[] }).command = match

                    return true
                }
            }

            return false
        }

        return check
    }

    /**
     * Shorthand filter that matches /start commands sent to bot's
     * private messages.
     */
    export const start = and(chat('private'), command('start'))

    /**
     * Filter for deep links (i.e. `/start <deeplink_parameter>`).
     *
     * If the parameter is a regex, groups are added to `msg.command`,
     * meaning that the first group is available in `msg.command[2]`.
     */
    export const deeplink = (
        params: MaybeArray<string | RegExp>,
    ): UpdateFilter<Message, { command: string[] }> => {
        if (!Array.isArray(params)) {
            return and(start, (_msg: Message) => {
                const msg = _msg as Message & { command: string[] }

                if (msg.command.length !== 2) return false

                const p = msg.command[1]
                if (typeof params === 'string' && p === params) return true

                const m = p.match(params)
                if (!m) return false

                msg.command.push(...m.slice(1))

                return true
            })
        }

        return and(start, (_msg: Message) => {
            const msg = _msg as Message & { command: string[] }

            if (msg.command.length !== 2) return false

            const p = msg.command[1]

            for (const param of params) {
                if (typeof param === 'string' && p === param) return true

                const m = p.match(param)
                if (!m) continue

                msg.command.push(...m.slice(1))

                return true
            }

            return false
        })
    }

    /**
     * Create a filter for {@link ChatMemberUpdate} by update type
     *
     * @param types  Update type(s)
     * @link ChatMemberUpdate.Type
     */
    export const chatMember: {
        <T extends ChatMemberUpdateType>(type: T): UpdateFilter<
            ChatMemberUpdate,
            { type: T }
        >
        <T extends ChatMemberUpdateType[]>(types: T): UpdateFilter<
            ChatMemberUpdate,
            { type: T[number] }
        >
    } = (
        types: MaybeArray<ChatMemberUpdateType>,
    ): UpdateFilter<ChatMemberUpdate> => {
        if (Array.isArray(types)) {
            const index: Partial<Record<ChatMemberUpdateType, true>> = {}
            types.forEach((typ) => (index[typ] = true))

            return (upd) => upd.type in index
        }

        return (upd) => upd.type === types
    }

    /**
     * Create a filter for {@link UserStatusUpdate} by new user status
     *
     * @param statuses  Update type(s)
     * @link User.Status
     */
    export const userStatus: {
        <T extends UserStatus>(status: T): UpdateFilter<
            UserStatusUpdate,
            {
                type: T
                lastOnline: T extends 'offline' ? Date : null
                nextOffline: T extends 'online' ? Date : null
            }
        >
        <T extends UserStatus[]>(statuses: T): UpdateFilter<
            UserStatusUpdate,
            { type: T[number] }
        >
    } = (statuses: MaybeArray<UserStatus>): UpdateFilter<UserStatusUpdate> => {
        if (Array.isArray(statuses)) {
            const index: Partial<Record<UserStatus, true>> = {}
            statuses.forEach((typ) => (index[typ] = true))

            return (upd) => upd.status in index
        }

        return (upd) => upd.status === statuses
    }

    /**
     * Create a filter for {@link ChatMemberUpdate} for updates
     * regarding current user
     */
    export const chatMemberSelf: UpdateFilter<
        ChatMemberUpdate,
        { isSelf: true }
    > = (upd) => upd.isSelf

    /**
     * Create a filter for callback queries that
     * originated from an inline message
     */
    export const callbackInline: UpdateFilter<
        CallbackQuery,
        { isInline: true }
    > = (q) => q.isInline

    /**
     * Create a filter for the cases when the state is empty
     */
    export const stateEmpty: UpdateFilter<Message> = async (upd, state) => {
        if (!state) return false

        return !(await state.get())
    }

    /**
     * Create a filter based on state predicate
     *
     * If state exists and matches `predicate`, update passes
     * this filter, otherwise it doesn't
     *
     * @param predicate  State predicate
     */
    export const state = <T>(
        predicate: (state: T) => MaybeAsync<boolean>,
    // eslint-disable-next-line @typescript-eslint/ban-types
    ): UpdateFilter<Message | CallbackQuery, {}, T> => {
        return async (upd, state) => {
            if (!state) return false
            const data = await state.get()
            if (!data) return false

            return predicate(data)
        }
    }
}
