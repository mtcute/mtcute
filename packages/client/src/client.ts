/* THIS FILE WAS AUTO-GENERATED */
import { BaseTelegramClient } from '@mtcute/core'
import { tl } from '@mtcute/tl'
import { acceptTos } from './methods/auth/accept-tos'
import { checkPassword } from './methods/auth/check-password'
import { getPasswordHint } from './methods/auth/get-password-hint'
import { logOut } from './methods/auth/log-out'
import { recoverPassword } from './methods/auth/recover-password'
import { resendCode } from './methods/auth/resend-code'
import { run } from './methods/auth/run'
import { sendCode } from './methods/auth/send-code'
import { sendRecoveryCode } from './methods/auth/send-recovery-code'
import { signInBot } from './methods/auth/sign-in-bot'
import { signIn } from './methods/auth/sign-in'
import { signUp } from './methods/auth/sign-up'
import { startTest } from './methods/auth/start-test'
import { start } from './methods/auth/start'
import { answerCallbackQuery } from './methods/bots/answer-callback-query'
import { answerInlineQuery } from './methods/bots/answer-inline-query'
import { addChatMembers } from './methods/chats/add-chat-members'
import { archiveChats } from './methods/chats/archive-chats'
import { createChannel } from './methods/chats/create-channel'
import { createGroup } from './methods/chats/create-group'
import { createSupergroup } from './methods/chats/create-supergroup'
import { deleteChannel } from './methods/chats/delete-channel'
import { deleteChatPhoto } from './methods/chats/delete-chat-photo'
import { deleteGroup } from './methods/chats/delete-group'
import { deleteHistory } from './methods/chats/delete-history'
import { deleteUserHistory } from './methods/chats/delete-user-history'
import { getChatEventLog } from './methods/chats/get-chat-event-log'
import { getChatMember } from './methods/chats/get-chat-member'
import { getChatMembers } from './methods/chats/get-chat-members'
import { getChatPreview } from './methods/chats/get-chat-preview'
import { getChat } from './methods/chats/get-chat'
import { getFullChat } from './methods/chats/get-full-chat'
import { getNearbyChats } from './methods/chats/get-nearby-chats'
import { iterChatMembers } from './methods/chats/iter-chat-members'
import { joinChat } from './methods/chats/join-chat'
import { leaveChat } from './methods/chats/leave-chat'
import { saveDraft } from './methods/chats/save-draft'
import { setChatDefaultPermissions } from './methods/chats/set-chat-default-permissions'
import { setChatDescription } from './methods/chats/set-chat-description'
import { setChatPhoto } from './methods/chats/set-chat-photo'
import { setChatTitle } from './methods/chats/set-chat-title'
import { setChatUsername } from './methods/chats/set-chat-username'
import { setSlowMode } from './methods/chats/set-slow-mode'
import { unarchiveChats } from './methods/chats/unarchive-chats'
import { addContact } from './methods/contacts/add-contact'
import { deleteContacts } from './methods/contacts/delete-contacts'
import { getContacts } from './methods/contacts/get-contacts'
import { importContacts } from './methods/contacts/import-contacts'
import { createFolder } from './methods/dialogs/create-folder'
import { deleteFolder } from './methods/dialogs/delete-folder'
import { editFolder } from './methods/dialogs/edit-folder'
import { findFolder } from './methods/dialogs/find-folder'
import { getDialogs } from './methods/dialogs/get-dialogs'
import { getFolders } from './methods/dialogs/get-folders'
import { downloadAsBuffer } from './methods/files/download-buffer'
import { downloadToFile } from './methods/files/download-file'
import { downloadAsIterable } from './methods/files/download-iterable'
import { downloadAsStream } from './methods/files/download-stream'
import { _normalizeFileToDocument } from './methods/files/normalize-file-to-document'
import { _normalizeInputFile } from './methods/files/normalize-input-file'
import { _normalizeInputMedia } from './methods/files/normalize-input-media'
import { uploadFile } from './methods/files/upload-file'
import { createInviteLink } from './methods/invite-links/create-invite-link'
import { editInviteLink } from './methods/invite-links/edit-invite-link'
import { exportInviteLink } from './methods/invite-links/export-invite-link'
import { getInviteLinkMembers } from './methods/invite-links/get-invite-link-members'
import { getInviteLink } from './methods/invite-links/get-invite-link'
import { getInviteLinks } from './methods/invite-links/get-invite-links'
import { getPrimaryInviteLink } from './methods/invite-links/get-primary-invite-link'
import { revokeInviteLink } from './methods/invite-links/revoke-invite-link'
import { closePoll } from './methods/messages/close-poll'
import { deleteMessages } from './methods/messages/delete-messages'
import { editInlineMessage } from './methods/messages/edit-inline-message'
import { editMessage } from './methods/messages/edit-message'
import { _findMessageInUpdate } from './methods/messages/find-in-update'
import { forwardMessages } from './methods/messages/forward-messages'
import { getHistory } from './methods/messages/get-history'
import { getMessageGroup } from './methods/messages/get-message-group'
import { getMessages } from './methods/messages/get-messages'
import { iterHistory } from './methods/messages/iter-history'
import { _parseEntities } from './methods/messages/parse-entities'
import { pinMessage } from './methods/messages/pin-message'
import { searchGlobal } from './methods/messages/search-global'
import { searchMessages } from './methods/messages/search-messages'
import { sendCopy } from './methods/messages/send-copy'
import { sendMediaGroup } from './methods/messages/send-media-group'
import { sendMedia } from './methods/messages/send-media'
import { sendText } from './methods/messages/send-text'
import { sendTyping } from './methods/messages/send-typing'
import { sendVote } from './methods/messages/send-vote'
import { unpinMessage } from './methods/messages/unpin-message'
import { initTakeoutSession } from './methods/misc/init-takeout-session'
import {
    getParseMode,
    registerParseMode,
    setDefaultParseMode,
    unregisterParseMode,
} from './methods/parse-modes/parse-modes'
import { changeCloudPassword } from './methods/pasword/change-cloud-password'
import { enableCloudPassword } from './methods/pasword/enable-cloud-password'
import {
    cancelPasswordEmail,
    resendPasswordEmail,
    verifyPasswordEmail,
} from './methods/pasword/password-email'
import { removeCloudPassword } from './methods/pasword/remove-cloud-password'
import { addStickerToSet } from './methods/stickers/add-sticker-to-set'
import { createStickerSet } from './methods/stickers/create-sticker-set'
import { deleteStickerFromSet } from './methods/stickers/delete-sticker-from-set'
import { getInstalledStickers } from './methods/stickers/get-installed-stickers'
import { getStickerSet } from './methods/stickers/get-sticker-set'
import { moveStickerInSet } from './methods/stickers/move-sticker-in-set'
import { setStickerSetThumb } from './methods/stickers/set-sticker-set-thumb'
import {
    _fetchUpdatesState,
    _handleUpdate,
    _loadStorage,
    _saveStorage,
    catchUp,
    dispatchUpdate,
} from './methods/updates'
import { blockUser } from './methods/users/block-user'
import { deleteProfilePhotos } from './methods/users/delete-profile-photos'
import { getCommonChats } from './methods/users/get-common-chats'
import { getMe } from './methods/users/get-me'
import { getProfilePhotos } from './methods/users/get-profile-photos'
import { getUsers } from './methods/users/get-users'
import { iterProfilePhotos } from './methods/users/iter-profile-photos'
import { resolvePeerMany } from './methods/users/resolve-peer-many'
import { resolvePeer } from './methods/users/resolve-peer'
import { setOffline } from './methods/users/set-offline'
import { setProfilePhoto } from './methods/users/set-profile-photo'
import { unblockUser } from './methods/users/unblock-user'
import { updateProfile } from './methods/users/update-profile'
import { updateUsername } from './methods/users/update-username'
import { IMessageEntityParser } from './parser'
import { Readable } from 'stream'
import {
    Chat,
    ChatEvent,
    ChatInviteLink,
    ChatMember,
    ChatPreview,
    ChatsIndex,
    Dialog,
    FileDownloadParameters,
    InputChatPermissions,
    InputFileLike,
    InputInlineResult,
    InputMediaLike,
    InputPeerLike,
    InputStickerSetItem,
    MaybeDynamic,
    Message,
    PartialExcept,
    PartialOnly,
    Photo,
    Poll,
    ReplyMarkup,
    SentCode,
    StickerSet,
    TakeoutSession,
    TermsOfService,
    TypingStatus,
    UploadFileLike,
    UploadedFile,
    User,
    UsersIndex,
} from './types'
import { MaybeArray, MaybeAsync, TelegramConnection } from '@mtcute/core'
import { Lock } from './utils/lock'
import { tdFileId } from '@mtcute/file-id'

export interface TelegramClient extends BaseTelegramClient {
    /**
     * Accept the given TOS
     *
     * @param tosId  TOS id
     */
    acceptTos(tosId: string): Promise<boolean>
    /**
     * Check your Two-Step verification password and log in
     *
     * @param password  Your Two-Step verification password
     * @returns  The authorized user
     * @throws BadRequestError  In case the password is invalid
     */
    checkPassword(password: string): Promise<User>
    /**
     * Get your Two-Step Verification password hint.
     *
     * @returns  The password hint as a string, if any
     */
    getPasswordHint(): Promise<string | null>
    /**
     * Log out from Telegram account and optionally reset the session storage.
     *
     * When you log out, you can immediately log back in using
     * the same {@link TelegramClient} instance.
     *
     * @param resetSession  (default: `false`) Whether to reset the session
     * @returns  On success, `true` is returned
     */
    logOut(resetSession?: boolean): Promise<true>
    /**
     * Recover your password with a recovery code and log in.
     *
     * @param recoveryCode  The recovery code sent via email
     * @returns  The authorized user
     * @throws BadRequestError  In case the code is invalid
     */
    recoverPassword(recoveryCode: string): Promise<User>
    /**
     * Re-send the confirmation code using a different type.
     *
     * The type of the code to be re-sent is specified in the `nextType` attribute of
     * {@link SentCode} object returned by {@link sendCode}
     *
     * @param phone  Phone number in international format
     * @param phoneCodeHash  Confirmation code identifier from {@link SentCode}
     */
    resendCode(phone: string, phoneCodeHash: string): Promise<SentCode>
    /**
     * Simple wrapper that calls {@link start} and then
     * provided callback function (if any) without the
     * need to introduce a `main()` function manually.
     *
     * Errors that were encountered while calling {@link start}
     * and `then` will be emitted as usual, and can be caught with {@link onError}
     *
     * @param params  Parameters to be passed to {@link params}
     * @param then  Function to be called after {@link start} returns
     */
    run(
        params: Parameters<TelegramClient['start']>[0],
        then?: (user: User) => void | Promise<void>
    ): void
    /**
     * Send the confirmation code to the given phone number
     *
     * @param phone  Phone number in international format.
     * @returns  An object containing information about the sent confirmation code
     */
    sendCode(phone: string): Promise<SentCode>
    /**
     * Send a code to email needed to recover your password
     *
     * @returns  String containing email pattern to which the recovery code was sent
     */
    sendRecoveryCode(): Promise<string>
    /**
     * Authorize a bot using its token issued by [@BotFather](//t.me/BotFather)
     *
     * @param token  Bot token issued by BotFather
     * @returns  Bot's {@link User} object
     * @throws BadRequestError  In case the bot token is invalid
     */
    signInBot(token: string): Promise<User>
    /**
     * Authorize a user in Telegram with a valid confirmation code.
     *
     * @param phone  Phone number in international format
     * @param phoneCodeHash  Code identifier from {@link TelegramClient.sendCode}
     * @param phoneCode  The confirmation code that was received
     * @returns
     *   - If the code was valid and authorization succeeded, the {@link User} is returned.
     *   - If the given phone number needs to be registered AND the ToS must be accepted,
     *     an object containing them is returned.
     *   - If the given phone number needs to be registered, `false` is returned.
     * @throws BadRequestError  In case the arguments are invalid
     * @throws SessionPasswordNeededError  In case a password is needed to sign in
     */
    signIn(
        phone: string,
        phoneCodeHash: string,
        phoneCode: string
    ): Promise<User | TermsOfService | false>
    /**
     * Register a new user in Telegram.
     *
     * @param phone  Phone number in international format
     * @param phoneCodeHash  Code identifier from {@link TelegramClient.sendCode}
     * @param firstName  New user's first name
     * @param lastName  (default: `''`) New user's last name
     */
    signUp(
        phone: string,
        phoneCodeHash: string,
        firstName: string,
        lastName?: string
    ): Promise<User>
    /**
     * Utility function to quickly authorize on test DC
     * using a [Test phone number](https://core.telegram.org/api/auth#test-phone-numbers),
     * which is randomly generated by default.
     *
     * > **Note**: Using this method assumes that you
     * > are using a test DC in `primaryDc` parameter.
     *
     * @param params  Additional parameters
     */
    startTest(params?: {
        /**
         * Whether to log out if current session is logged in.
         *
         * Defaults to false.
         */
        logout?: boolean

        /**
         * Override phone number. Must be a valid Test phone number.
         *
         * By default is randomly generated.
         */
        phone?: string

        /**
         * Override user's DC. Must be a valid test DC.
         */
        dcId?: number

        /**
         * First name of the user (used only for sign-up, defaults to 'User')
         */
        firstName?: MaybeDynamic<string>

        /**
         * Last name of the user (used only for sign-up, defaults to empty)
         */
        lastName?: MaybeDynamic<string>

        /**
         * By using this method to sign up an account, you are agreeing to Telegram
         * ToS. This is required and your account will be banned otherwise.
         * See https://telegram.org/tos and https://core.telegram.org/api/terms.
         *
         * If true, TOS will not be displayed and `tosCallback` will not be called.
         */
        acceptTos?: boolean
    }): Promise<User>
    /**
     * Start the client in an interactive and declarative manner,
     * by providing callbacks for authorization details.
     *
     * This method handles both login and sign up, and also handles 2FV
     *
     * All parameters are `MaybeDynamic<T>`, meaning you
     * can either supply `T`, or a function that returns `MaybeAsync<T>`
     *
     * This method is intended for simple and fast use in automated
     * scripts and bots. If you are developing a custom client,
     * you'll probably need to use other auth methods.
     *
     */
    start(params: {
        /**
         * Phone number of the account.
         * If account does not exist, it will be created
         */
        phone?: MaybeDynamic<string>

        /**
         * Bot token to use. Ignored if `phone` is supplied.
         */
        botToken?: MaybeDynamic<string>

        /**
         * 2FA password. Ignored if `botToken` is supplied
         */
        password?: MaybeDynamic<string>

        /**
         * Code sent to the phone (either sms, call, flash call or other).
         * Ignored if `botToken` is supplied, must be present if `phone` is supplied.
         */
        code?: MaybeDynamic<string>

        /**
         * If passed, this function will be called if provided code or 2FA password
         * was invalid. New code/password will be requested later.
         *
         * If provided `code`/`password` is a constant string, providing an
         * invalid one will interrupt authorization flow.
         */
        invalidCodeCallback?: (type: 'code' | 'password') => MaybeAsync<void>

        /**
         * Whether to force code delivery through SMS
         */
        forceSms?: boolean

        /**
         * First name of the user (used only for sign-up, defaults to 'User')
         */
        firstName?: MaybeDynamic<string>

        /**
         * Last name of the user (used only for sign-up, defaults to empty)
         */
        lastName?: MaybeDynamic<string>

        /**
         * By using this method to sign up an account, you are agreeing to Telegram
         * ToS. This is required and your account will be banned otherwise.
         * See https://telegram.org/tos and https://core.telegram.org/api/terms.
         *
         * If true, TOS will not be displayed and `tosCallback` will not be called.
         */
        acceptTos?: boolean

        /**
         * Custom method to display ToS. Can be used to show a GUI alert of some kind.
         * Defaults to `console.log`
         */
        tosCallback?: (tos: TermsOfService) => MaybeAsync<void>

        /**
         * Custom method that is called when a code is sent. Can be used
         * to show a GUI alert of some kind.
         * Defaults to `console.log`
         *
         * @param code
         */
        codeSentCallback?: (code: SentCode) => MaybeAsync<void>

        /**
         * Whether to "catch up" (load missed updates).
         * Only applicable if the saved session already
         * contained authorization and updates state.
         *
         * Note: you should register your handlers
         * before calling `start()`, otherwise they will
         * not be called.
         *
         * Note: In case the storage was not properly
         * closed the last time, "catching up" might
         * result in duplicate updates.
         *
         * Defaults to `false`.
         */
        catchUp?: boolean
    }): Promise<User>
    /**
     * Send an answer to a callback query.
     *
     * @param queryId  ID of the callback query
     * @param params  Parameters of the answer
     */
    answerCallbackQuery(
        queryId: tl.Long,
        params?: {
            /**
             * Maximum amount of time in seconds for which
             * this result can be cached by the client (not server!).
             *
             * Defaults to `0`
             */
            cacheTime?: number

            /**
             * Text of the notification (0-200 chars).
             *
             * If not set, nothing will be displayed
             */
            text?: string

            /**
             * Whether to show an alert in the middle of the screen
             * instead of a notification at the top of the screen.
             *
             * Defaults to `false`.
             */
            alert?: boolean

            /**
             * URL that the client should open.
             *
             * If this was a button containing a game,
             * you can provide arbitrary link to your game.
             * Otherwise, you can only use links in the format
             * `t.me/your_bot?start=...` that open your bot
             * with a deep-link parameter.
             */
            url?: string
        }
    ): Promise<void>
    /**
     * Answer an inline query.
     *
     * @param queryId  Inline query ID
     * @param results  Results of the query
     * @param params  Additional parameters

     */
    answerInlineQuery(
        queryId: tl.Long,
        results: InputInlineResult[],
        params?: {
            /**
             * Maximum number of time in seconds that the results of the
             * query may be cached on the server for.
             *
             * Defaults to `300`
             */
            cacheTime?: number

            /**
             * Whether the results should be displayed as a gallery instead
             * of a vertical list. Only applicable to some media types.
             *
             * Defaults to `false`
             */
            gallery?: boolean

            /**
             * Whether the results should only be cached on the server
             * for the user who sent the query.
             *
             * Defaults to `false`
             */
            private?: boolean

            /**
             * Next pagination offset (up to 64 bytes).
             *
             * When user has reached the end of the current results,
             * it will re-send the inline query with the same text, but
             * with `offset` set to this value.
             *
             * If omitted or empty string is provided, it is assumed that
             * there are no more results.
             */
            nextOffset?: string

            /**
             * If passed, clients will display a button before any other results,
             * that when clicked switches the user to a private chat with the bot
             * and sends the bot `/start ${parameter}`.
             *
             * An example from the Bot API docs:
             *
             * An inline bot that sends YouTube videos can ask the user to connect
             * the bot to their YouTube account to adapt search results accordingly.
             * To do this, it displays a "Connect your YouTube account" button above
             * the results, or even before showing any. The user presses the button,
             * switches to a private chat with the bot and, in doing so, passes a start
             * parameter that instructs the bot to return an oauth link. Once done, the
             * bot can offer a switch_inline button so that the user can easily return to
             * the chat where they wanted to use the bot's inline capabilities
             */
            switchPm?: {
                /**
                 * Text of the button
                 */
                text: string

                /**
                 * Parameter for `/start` command
                 */
                parameter: string
            }

            /**
             * Parse mode to use when parsing inline message text.
             * Defaults to current default parse mode (if any).
             *
             * Passing `null` will explicitly disable formatting.
             *
             * **Note**: inline results themselves *can not* have markup
             * entities, only the messages that are sent once a result is clicked.
             */
            parseMode?: string | null
        }
    ): Promise<void>
    /**
     * Add new members to a group, supergroup or channel.
     *
     * @param chatId  ID of the chat or its username
     * @param users ID(s) of the users, their username(s) or phone(s).
     * @param forwardCount
     *  (default: `100`)
     *   Number of old messages to be forwarded (0-100).
     *   Only applicable to legacy groups, ignored for supergroups and channels
     */
    addChatMembers(
        chatId: InputPeerLike,
        users: MaybeArray<InputPeerLike>,
        forwardCount?: number
    ): Promise<void>
    /**
     * Archive one or more chats
     *
     * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
     */
    archiveChats(chats: MaybeArray<InputPeerLike>): Promise<void>
    /**
     * Create a new broadcast channel
     *
     * @param title  Channel title
     * @param description  (default: `''`) Channel description
     * @returns  Newly created channel
     */
    createChannel(title: string, description?: string): Promise<Chat>
    /**
     * Create a legacy group chat
     *
     * If you want to create a supergroup, use {@link createSupergroup}
     * instead.
     *
     * @param title  Group title
     * @param users
     *   User(s) to be invited in the group (ID(s), username(s) or phone number(s)).
     *   Due to Telegram limitations, you can't create a legacy group with yourself.
     */
    createGroup(title: string, users: MaybeArray<InputPeerLike>): Promise<Chat>
    /**
     * Create a new supergroup
     *
     * @param title  Title of the supergroup
     * @param description  (default: `''`) Description of the supergroup
     */
    createSupergroup(title: string, description?: string): Promise<Chat>

    /**
     * Delete a channel or a supergroup
     *
     * @param chatId  Chat ID or username
     */
    deleteChannel(chatId: InputPeerLike): Promise<void>

    /**
     * Delete a channel or a supergroup
     *
     * @param chatId  Chat ID or username
     */
    deleteSupergroup(chatId: InputPeerLike): Promise<void>
    /**
     * Delete a chat photo
     *
     * You must be an administrator and have the appropriate permissions.
     *
     * @param chatId  Chat ID or username
     */
    deleteChatPhoto(chatId: InputPeerLike): Promise<void>
    /**
     * Delete a legacy group chat for all members
     *
     * @param chatId  Chat ID
     */
    deleteGroup(chatId: InputPeerLike): Promise<void>
    /**
     * Delete communication history (for private chats
     * and legacy groups)
     *
     * @param chat  Chat or user ID, username, phone number, `"me"` or `"self"`
     * @param mode
     *  (default: `'delete'`)
     *   Deletion mode. Can be:
     *   - `delete`: delete messages (only for yourself)
     *   - `clear`: delete messages (only for yourself)
     *   - `revoke`: delete messages for all users
     *   - I'm not sure what's the difference between `delete` and `clear`,
     *     but they are in fact different flags in TL object.
     * @param maxId  (default: `0`) Maximum ID of message to delete. Defaults to 0 (remove all messages)
     */
    deleteHistory(
        chat: InputPeerLike,
        mode?: 'delete' | 'clear' | 'revoke',
        maxId?: number
    ): Promise<void>
    /**
     * Delete all messages of a user in a supergroup
     *
     * @param chatId  Chat ID
     * @param userId  User ID
     */
    deleteUserHistory(
        chatId: InputPeerLike,
        userId: InputPeerLike
    ): Promise<void>
    /**
     * Get chat event log ("Recent actions" in official
     * clients).
     *
     * Only available for supergroups and channels, and
     * requires (any) administrator rights.
     *
     * Results are returned in reverse chronological
     * order (i.e. newest first) and event IDs are
     * in direct chronological order (i.e. newer
     * events have bigger event ID)
     *
     * @param chatId  Chat ID
     * @param params

     */
    getChatEventLog(
        chatId: InputPeerLike,
        params?: {
            /**
             * Search query
             */
            query?: string

            /**
             * Minimum event ID to return
             */
            minId?: tl.Long

            /**
             * Maximum event ID to return,
             * can be used as a base offset
             */
            maxId?: tl.Long

            /**
             * List of users whose actions to return
             */
            users?: InputPeerLike[]

            /**
             * Event filters. Can be a TL object, or one or more
             * action types.
             *
             * Note that some filters are grouped in TL
             * (i.e. `info=true` will return `title_changed`,
             * `username_changed` and many more),
             * and when passing one or more action types,
             * they will be filtered locally.
             */
            filters?:
                | tl.TypeChannelAdminLogEventsFilter
                | MaybeArray<Exclude<ChatEvent.Action, null>['type']>

            /**
             * Limit the number of events returned.
             *
             * Defaults to `Infinity`, i.e. all events are returned
             */
            limit?: number

            /**
             * Chunk size, usually not needed.
             *
             * Defaults to `100`
             */
            chunkSize?: number
        }
    ): AsyncIterableIterator<ChatEvent>
    /**
     * Get information about a single chat member
     *
     * @param chatId  Chat ID or username
     * @param userId  User ID, username, phone number, `"me"` or `"self"`
     * @throws UserNotParticipantError  In case given user is not a participant of a given chat
     */
    getChatMember(
        chatId: InputPeerLike,
        userId: InputPeerLike
    ): Promise<ChatMember>
    /**
     * Get a chunk of members of some chat.
     *
     * You can retrieve up to 200 members at once
     *
     * @param chatId  Chat ID or username
     * @param params  Additional parameters
     */
    getChatMembers(
        chatId: InputPeerLike,
        params?: {
            /**
             * Search query to filter members by their display names and usernames
             * Defaults to `''` (empty string)
             *
             * > **Note**: Only used for these values of `filter`:
             * > `all`, `banned`, `restricted`, `contacts`
             */
            query?: string

            /**
             * Sequential number of the first member to be returned.
             */
            offset?: number

            /**
             * Maximum number of members to be retrieved. Defaults to `200`
             */
            limit?: number

            /**
             * Type of the query. Can be:
             *  - `all`: get all members
             *  - `banned`: get only banned members
             *  - `restricted`: get only restricted members
             *  - `bots`: get only bots
             *  - `recent`: get recent members
             *  - `admins`: get only administrators (and creator)
             *  - `contacts`: get only contacts
             *  - `mention`: get users that can be mentioned ([learn more](https://mt.tei.su/tl/class/channelParticipantsMentions))
             *
             *  Only used for channels and supergroups. Defaults to `recent`
             */
            type?:
                | 'all'
                | 'banned'
                | 'restricted'
                | 'bots'
                | 'recent'
                | 'admins'
                | 'contacts'
                | 'mention'
        }
    ): Promise<ChatMember[]>
    /**
     * Get preview information about a private chat.
     *
     * @param inviteLink  Invite link
     * @throws MtCuteArgumentError  In case invite link has invalid format
     * @throws MtCuteNotFoundError
     *   In case you are trying to get info about private chat that you have already joined.
     *   Use {@link getChat} or {@link getFullChat} instead.
     */
    getChatPreview(inviteLink: string): Promise<ChatPreview>
    /**
     * Get basic information about a chat.
     *
     * @param chatId  ID of the chat, its username or invite link
     * @throws MtCuteArgumentError
     *   In case you are trying to get info about private chat that you haven't joined.
     *   Use {@link getChatPreview} instead.
     */
    getChat(chatId: InputPeerLike): Promise<Chat>
    /**
     * Get full information about a chat.
     *
     * @param chatId  ID of the chat, its username or invite link
     * @throws MtCuteArgumentError
     *   In case you are trying to get info about private chat that you haven't joined.
     *   Use {@link getChatPreview} instead.
     */
    getFullChat(chatId: InputPeerLike): Promise<Chat>
    /**
     * Get nearby chats
     *
     * @param latitude  Latitude of the location
     * @param longitude  Longitude of the location

     */
    getNearbyChats(latitude: number, longitude: number): Promise<Chat[]>
    /**
     * Iterate through chat members
     *
     * This method is a small wrapper over {@link getChatMembers},
     * which also handles duplicate entries (i.e. does not yield
     * the same member twice)
     *
     * @param chatId  Chat ID or username
     * @param params  Additional parameters
     */
    iterChatMembers(
        chatId: InputPeerLike,
        params?: Parameters<TelegramClient['getChatMembers']>[1] & {
            /**
             * Chunk size, which will be passed as `limit` parameter
             * to {@link getChatMembers}. Usually you shouldn't care about this.
             *
             * Defaults to `200`
             */
            chunkSize?: number
        }
    ): AsyncIterableIterator<ChatMember>
    /**
     * Join a channel or supergroup
     *
     * @param chatId
     *   Chat identifier. Either an invite link (`t.me/joinchat/*`), a username (`@username`)
     *   or ID of the linked supergroup or channel.
     */
    joinChat(chatId: InputPeerLike): Promise<Chat>
    /**
     * Leave a group chat, supergroup or channel
     *
     * @param chatId  Chat ID or username
     * @param clear  (default: `false`) Whether to clear history after leaving (only for legacy group chats)
     */
    leaveChat(chatId: InputPeerLike, clear?: boolean): Promise<void>
    /**
     * Save or delete a draft message associated with some chat
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param draft  Draft message, or `null` to delete.
     */
    saveDraft(
        chatId: InputPeerLike,
        draft: null | Omit<tl.RawDraftMessage, '_' | 'date'>
    ): Promise<void>
    /**
     * Change default chat permissions for all members.
     *
     * You must be an administrator in the chat and have appropriate permissions.
     *
     * @param chatId  Chat ID or username
     * @param permissions  New default chat permissions
     * @example
     * ```typescript
     * // Completely restrict chat
     * await tg.setDefaultChatPermissions('somechat', {})
     *
     * // Chat members can only send text, media, stickers and GIFs
     * await tg.setDefaultChatPermissions('somechat', {
     *     canSendMessages: true,
     *     canSendMedia: true,
     *     canSendStickers: true,
     *     canSendGifs: true,
     * })
     * ```
     */
    setChatDefaultPermissions(
        chatId: InputPeerLike,
        permissions: InputChatPermissions
    ): Promise<Chat>
    /**
     * Change chat description
     *
     * You must be an administrator and have the appropriate permissions.
     *
     * @param chatId  Chat ID or username
     * @param description  New chat description, 0-255 characters
     */
    setChatDescription(
        chatId: InputPeerLike,
        description: string
    ): Promise<void>
    /**
     * Set a new chat photo or video.
     *
     * You must be an administrator and have the appropriate permissions.
     *
     * @param chatId  Chat ID or username
     * @param type  Media type (photo or video)
     * @param media  Input media file
     * @param previewSec
     *   When `type = video`, timestamp in seconds which will be shown
     *   as a static preview.
     */
    setChatPhoto(
        chatId: InputPeerLike,
        type: 'photo' | 'video',
        media: InputFileLike,
        previewSec?: number
    ): Promise<void>
    /**
     * Change chat title
     *
     * You must be an administrator and have the appropriate permissions.
     *
     * @param chatId  Chat ID or username
     * @param title  New chat title, 1-255 characters
     */
    setChatTitle(chatId: InputPeerLike, title: string): Promise<void>
    /**
     * Change supergroup/channel username
     *
     * You must be an administrator and have the appropriate permissions.
     *
     * @param chatId  Chat ID or current username
     * @param username  New username, or `null` to remove
     */
    setChatUsername(
        chatId: InputPeerLike,
        username: string | null
    ): Promise<void>
    /**
     * Set supergroup's slow mode interval.
     *
     * @param chatId  Chat ID or username
     * @param seconds
     *  (default: `0`)
     *   Slow mode interval in seconds.
     *   Users will be able to send a message only once per this interval.
     *   Valid values are: `0 (off), 10, 30, 60 (1m), 300 (5m), 900 (15m) or 3600 (1h)`
     */
    setSlowMode(chatId: InputPeerLike, seconds?: number): Promise<void>
    /**
     * Unarchive one or more chats
     *
     * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
     */
    unarchiveChats(chats: MaybeArray<InputPeerLike>): Promise<void>
    /**
     * Add an existing Telegram user as a contact
     *
     * @param userId  User ID, username or phone number
     * @param params  Contact details
     */
    addContact(
        userId: InputPeerLike,
        params: {
            /**
             * First name of the contact
             */
            firstName: string

            /**
             * Last name of the contact
             */
            lastName?: string

            /**
             * Phone number of the contact, if available
             */
            phone?: string

            /**
             * Whether to share your own phone number
             * with the newly created contact (defaults to `false`)
             */
            sharePhone?: boolean
        }
    ): Promise<User>
    /**
     * Delete a single contact from your Telegram contacts list
     *
     * Returns deleted contact's profile or `null` in case
     * that user was not in your contacts list
     *
     * @param userId  User ID, username or phone number
     */
    deleteContacts(userId: InputPeerLike): Promise<User | null>
    /**
     * Delete one or more contacts from your Telegram contacts list
     *
     * Returns deleted contact's profiles. Does not return
     * profiles of users that were not in your contacts list
     *
     * @param userIds  User IDs, usernames or phone numbers
     */
    deleteContacts(userIds: InputPeerLike[]): Promise<User[]>
    /**
     * Get list of contacts from your Telegram contacts list.
     */
    getContacts(): Promise<User[]>
    /**
     * Import contacts to your Telegram contacts list.
     *
     * @param contacts  List of contacts
     */
    importContacts(
        contacts: PartialOnly<Omit<tl.RawInputPhoneContact, '_'>, 'clientId'>[]
    ): Promise<tl.contacts.RawImportedContacts>
    /**
     * Create a folder from given parameters
     *
     * ID for the folder is optional, if not
     * provided it will be derived automatically.
     *
     * @param folder  Parameters for the folder
     * @returns  Newly created folder

     */
    createFolder(
        folder: PartialExcept<tl.RawDialogFilter, 'title'>
    ): Promise<tl.RawDialogFilter>
    /**
     * Delete a folder by its ID
     *
     * @param id  Folder ID or folder itself
     */
    deleteFolder(id: number | tl.RawDialogFilter): Promise<void>
    /**
     * Edit a folder with given modification
     *
     * @param folder
     *     Folder, folder ID or name.
     *     Note that passing an ID or name will require re-fetching all folders,
     *     and passing name might affect not the right folder if you have multiple
     *     with the same name.
     * @param modification  Modification that will be applied to this folder
     * @returns  Modified folder
     */
    editFolder(
        folder: tl.RawDialogFilter | number | string,
        modification: Partial<Omit<tl.RawDialogFilter, 'id' | '_'>>
    ): Promise<tl.RawDialogFilter>
    /**
     * Find a folder by its parameter.
     *
     * > **Note**: Searching by title and/or emoji might not be
     * > accurate since you can set the same title and/or emoji
     * > to multiple folders.
     *
     * @param params  Search parameters. At least one must be set.
     */
    findFolder(params: {
        title?: string
        emoji?: string
        id?: number
    }): Promise<tl.RawDialogFilter | null>
    /**
     * Iterate over dialogs.
     *
     * Note that due to Telegram limitations,
     * ordering here can only be anti-chronological
     * (i.e. newest - first), and draft update date
     * is not considered when sorting.
     *
     * @param params  Fetch parameters

     */
    getDialogs(params?: {
        /**
         * Offset message date used as an anchor for pagination.
         */
        offsetDate?: Date | number

        /**
         * Offset message ID used as an anchor for pagination
         */
        offsetId?: number

        /**
         * Offset peer used as an anchor for pagination
         */
        offsetPeer?: tl.TypeInputPeer

        /**
         * Limits the number of dialogs to be received.
         *
         * Defaults to `Infinity`, i.e. all dialogs are fetched, ignored when `pinned=only`
         */
        limit?: number

        /**
         * Chunk size which will be passed to `messages.getDialogs`.
         * You shouldn't usually care about this.
         *
         * Defaults to 100.
         */
        chunkSize?: number

        /**
         * How to handle pinned dialogs?
         *
         * Whether to `include` them at the start of the list,
         * `exclude` them at all, or `only` return pinned dialogs.
         *
         * Additionally, for folders you can specify
         * `keep`, which will return pinned dialogs
         * ordered by date among other non-pinned dialogs.
         *
         * Defaults to `include`.
         *
         * > **Note**: When using `include` mode with folders,
         * > pinned dialogs will only be fetched if all offset
         * > parameters are unset.
         */
        pinned?: 'include' | 'exclude' | 'only' | 'keep'

        /**
         * How to handle archived chats?
         *
         * Whether to `keep` them among other dialogs,
         * `exclude` them from the list, or `only`
         * return archived dialogs
         *
         * Defaults to `exclude`, ignored for folders since folders
         * themselves contain information about archived chats.
         *
         * > **Note**: when fetching `only` pinned dialogs
         * > passing `keep` will act as passing `only`
         */
        archived?: 'keep' | 'exclude' | 'only'

        /**
         * Folder from which the dialogs will be fetched.
         *
         * You can pass folder object, id or title
         *
         * Note that passing anything except object will
         * cause the list of the folders to be fetched,
         * and passing a title may fetch from
         * a wrong folder if you have multiple with the same title.
         *
         * Also note that fetching dialogs in a folder is
         * *orders of magnitudes* slower than normal because
         * of Telegram API limitations - we have to fetch all dialogs
         * and filter the ones we need manually. If possible,
         * use {@link Dialog.filterFolder} instead.
         *
         * When a folder with given ID or title is not found,
         * {@link MtCuteArgumentError} is thrown
         *
         * By default fetches from "All" folder
         */
        folder?: string | number | tl.RawDialogFilter

        /**
         * Additional filtering for the dialogs.
         *
         * If `folder` is not provided, this filter is used instead.
         * If `folder` is provided, fields from this object are used
         * to override filters inside the folder.
         */
        filter?: Partial<Omit<tl.RawDialogFilter, '_' | 'id' | 'title'>>
    }): AsyncIterableIterator<Dialog>
    /**
     * Get list of folders.
     */
    getFolders(): Promise<tl.RawDialogFilter[]>
    /**
     * Download a file and return its contents as a Buffer.
     *
     * > **Note**: This method _will_ download the entire file
     * > into memory at once. This might cause an issue, so use wisely!
     *
     * @param params  File download parameters
     */
    downloadAsBuffer(params: FileDownloadParameters): Promise<Buffer>
    /**
     * Download a remote file to a local file (only for NodeJS).
     * Promise will resolve once the download is complete.
     *
     * @param filename  Local file name to which the remote file will be downloaded
     * @param params  File download parameters
     */
    downloadToFile(
        filename: string,
        params: FileDownloadParameters
    ): Promise<void>
    /**
     * Download a file and return it as an iterable, which yields file contents
     * in chunks of a given size. Order of the chunks is guaranteed to be
     * consecutive.
     *
     * @param params  Download parameters
     */
    downloadAsIterable(
        params: FileDownloadParameters
    ): AsyncIterableIterator<Buffer>
    /**
     * Download a file and return it as a Node readable stream,
     * streaming file contents.
     *
     * @param params  File download parameters
     */
    downloadAsStream(params: FileDownloadParameters): Readable
    /**
     * Upload a file to Telegram servers, without actually
     * sending a message anywhere. Useful when an `InputFile` is required.
     *
     * This method is quite low-level, and you should use other
     * methods like {@link sendDocument} that handle this under the hood.
     *
     * @param params  Upload parameters
     */
    uploadFile(params: {
        /**
         * Upload file source.
         *
         * > **Note**: `fs.ReadStream` is a subclass of `stream.Readable` and contains
         * > info about file name, thus you don't need to pass them explicitly.
         */
        file: UploadFileLike

        /**
         * File name for the uploaded file. Is usually inferred from path,
         * but should be provided for files sent as `Buffer` or stream.
         *
         * When file name can't be inferred, it falls back to "unnamed"
         */
        fileName?: string

        /**
         * Total file size. Automatically inferred for Buffer, File and local files.
         *
         * When using with streams, if `fileSize` is not passed, the entire file is
         * first loaded into memory to determine file size, and used as a Buffer later.
         * This might be a major performance bottleneck, so be sure to provide file size
         * when using streams and file size is known (which often is the case).
         */
        fileSize?: number

        /**
         * File MIME type. By default is automatically inferred from magic number
         * If MIME can't be inferred, it defaults to `application/octet-stream`
         */
        fileMime?: string

        /**
         * Upload part size (in KB).
         *
         * By default, automatically selected by file size.
         * Must not be bigger than 512 and must not be a fraction.
         */
        partSize?: number

        /**
         * Function that will be called after some part has been uploaded.
         *
         * @param uploaded  Number of bytes already uploaded
         * @param total  Total file size
         */
        progressCallback?: (uploaded: number, total: number) => void
    }): Promise<UploadedFile>
    /**
     * Create an additional invite link for the chat.
     *
     * You must be an administrator and have appropriate rights.
     *
     * @param chatId  Chat ID
     * @param params
     */
    createInviteLink(
        chatId: InputPeerLike,
        params?: {
            /**
             * Date when this link will expire.
             * If `number` is passed, UNIX time in ms is expected.
             */
            expires?: number | Date

            /**
             * Maximum number of users that can be members of this chat
             * at the same time after joining using this link.
             *
             * Integer in range `[1, 99999]` or `Infinity`, defaults to `Infinity`
             */
            usageLimit?: number
        }
    ): Promise<ChatInviteLink>
    /**
     * Edit an invite link. You can only edit non-primary
     * invite links.
     *
     * Only pass the fields that you want to modify.
     *
     * @param chatId  Chat ID
     * @param link  Invite link to edit
     * @param params
     * @returns  Modified invite link
     */
    editInviteLink(
        chatId: InputPeerLike,
        link: string,
        params: {
            /**
             * Date when this link will expire.
             * If `number` is passed, UNIX time in ms is expected.
             */
            expires?: number | Date

            /**
             * Maximum number of users that can be members of this chat
             * at the same time after joining using this link.
             *
             * Integer in range `[1, 99999]` or `Infinity`,
             */
            usageLimit?: number
        }
    ): Promise<ChatInviteLink>
    /**
     * Generate a new primary invite link for a chat,
     * old primary link is revoked.
     *
     * > **Note**: each administrator has their own primary invite link,
     * > and bots by default don't have one.
     *
     * @param chatId  Chat IDs
     */
    exportInviteLink(chatId: InputPeerLike): Promise<ChatInviteLink>
    /**
     * Iterate over users who have joined
     * the chat with the given invite link.
     *
     * @param chatId  Chat ID
     * @param link  Invite link
     * @param limit  (default: `Infinity`) Maximum number of users to return (by default returns all)
     */
    getInviteLinkMembers(
        chatId: InputPeerLike,
        link: string,
        limit?: number
    ): AsyncIterableIterator<ChatInviteLink.JoinedMember>
    /**
     * Get detailed information about an invite link
     *
     * @param chatId  Chat ID
     * @param link  The invite link
     */
    getInviteLink(chatId: InputPeerLike, link: string): Promise<ChatInviteLink>
    /**
     * Get invite links created by some administrator in the chat.
     *
     * As an administrator you can only get your own links
     * (i.e. `adminId = "self"`), as a creator you can get
     * any other admin's links.
     *
     * @param chatId  Chat ID
     * @param adminId  Admin who created the links
     * @param params
     */
    getInviteLinks(
        chatId: InputPeerLike,
        adminId: InputPeerLike,
        params?: {
            /**
             * Whether to fetch revoked invite links
             */
            revoked?: boolean

            /**
             * Limit the number of invite links to be fetched.
             * By default, all links are fetched.
             */
            limit?: number

            /**
             * Size of chunks which are fetched. Usually not needed.
             *
             * Defaults to `100`
             */
            chunkSize?: number
        }
    ): AsyncIterableIterator<ChatInviteLink>
    /**
     * Get primary invite link of a chat
     *
     * @param chatId  Chat ID
     */
    getPrimaryInviteLink(chatId: InputPeerLike): Promise<ChatInviteLink>
    /**
     * Revoke an invite link.
     *
     * If `link` is a primary invite link, a new invite link will be
     * generated automatically by Telegram
     *
     * @param chatId  Chat ID
     * @param link  Invite link to revoke
     * @returns  If `link` is a primary invite, newly generated invite link, otherwise the revoked link
     */
    revokeInviteLink(
        chatId: InputPeerLike,
        link: string
    ): Promise<ChatInviteLink>
    /**
     * Close a poll sent by you.
     *
     * Once closed, poll can't be re-opened, and nobody
     * will be able to vote in it
     *
     * @param chatId  Chat ID where this poll was found
     * @param message  Message ID where this poll was found
     */
    closePoll(chatId: InputPeerLike, message: number): Promise<Poll>
    /**
     * Delete messages, including service messages.
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param ids  Message(s) ID(s) to delete.
     * @param revoke  (default: `true`) Whether to "revoke" (i.e. delete for both sides). Only used for chats and private chats.
     */
    deleteMessages(
        chatId: InputPeerLike,
        ids: MaybeArray<number>,
        revoke?: boolean
    ): Promise<void>
    /**
     * Edit sent inline message text, media and reply markup.
     *
     * @param id
     *     Inline message ID, either as a TL object, or as a
     *     TDLib and Bot API compatible string
     * @param params
     */
    editInlineMessage(
        id: tl.TypeInputBotInlineMessageID | string,
        params: {
            /**
             * New message text
             *
             * When `media` is passed, `media.caption` is used instead
             */
            text?: string

            /**
             * Parse mode to use to parse entities before sending
             * the message. Defaults to current default parse mode (if any).
             *
             * Passing `null` will explicitly disable formatting.
             */
            parseMode?: string | null

            /**
             * List of formatting entities to use instead of parsing via a
             * parse mode.
             *
             * **Note:** Passing this makes the method ignore {@link parseMode}
             *
             * When `media` is passed, `media.entities` is used instead
             */
            entities?: tl.TypeMessageEntity[]

            /**
             * New message media
             */
            media?: InputMediaLike

            /**
             * Whether to disable links preview in this message
             */
            disableWebPreview?: boolean

            /**
             * For bots: new reply markup.
             * If omitted, existing markup will be removed.
             */
            replyMarkup?: ReplyMarkup

            /**
             * For media, upload progress callback.
             *
             * @param uploaded  Number of bytes uploaded
             * @param total  Total file size in bytes
             */
            progressCallback?: (uploaded: number, total: number) => void
        }
    ): Promise<void>
    /**
     * Edit message text, media, reply markup and schedule date.
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param message  Message or its ID
     * @param params
     */
    editMessage(
        chatId: InputPeerLike,
        message: number | Message,
        params: {
            /**
             * New message text
             *
             * When `media` is passed, `media.caption` is used instead
             */
            text?: string

            /**
             * Parse mode to use to parse entities before sending
             * the message. Defaults to current default parse mode (if any).
             *
             * Passing `null` will explicitly disable formatting.
             */
            parseMode?: string | null

            /**
             * List of formatting entities to use instead of parsing via a
             * parse mode.
             *
             * **Note:** Passing this makes the method ignore {@link parseMode}
             *
             * When `media` is passed, `media.entities` is used instead
             */
            entities?: tl.TypeMessageEntity[]

            /**
             * New message media
             */
            media?: InputMediaLike

            /**
             * Whether to disable links preview in this message
             */
            disableWebPreview?: boolean

            /**
             * For bots: new reply markup.
             * If omitted, existing markup will be removed.
             */
            replyMarkup?: ReplyMarkup

            /**
             * To re-schedule a message: new schedule date.
             * When passing a number, a UNIX time in ms is expected.
             */
            scheduleDate?: Date | number

            /**
             * For media, upload progress callback.
             *
             * @param uploaded  Number of bytes uploaded
             * @param total  Total file size in bytes
             */
            progressCallback?: (uploaded: number, total: number) => void
        }
    ): Promise<Message>
    /**
     * Forward a single message.
     *
     * To forward with a caption, use another overload that takes an array of IDs.
     *
     * @param toChatId  Destination chat ID, username, phone, `"me"` or `"self"`
     * @param fromChatId  Source chat ID, username, phone, `"me"` or `"self"`
     * @param message  Message ID
     * @param params  Additional sending parameters
     * @returns  Newly sent, forwarded messages in the destination chat
     */
    forwardMessages(
        toChatId: InputPeerLike,
        fromChatId: InputPeerLike,
        message: number,
        params?: {
            /**
             * Whether to forward this message silently.
             */
            silent?: boolean

            /**
             * If set, the message will be scheduled to this date.
             * When passing a number, a UNIX time in ms is expected.
             */
            schedule?: Date | number
        }
    ): Promise<Message>
    /**
     * Forward one or more messages, optionally including a caption message.
     * You can forward no more than 100 messages at once.
     *
     * If a caption message was sent, it will be the first message in the resulting array.
     *
     * @param toChatId  Destination chat ID, username, phone, `"me"` or `"self"`
     * @param fromChatId  Source chat ID, username, phone, `"me"` or `"self"`
     * @param messages  Message IDs
     * @param params  Additional sending parameters
     * @returns
     *   Newly sent, forwarded messages in the destination chat.
     *   If a caption message was provided, it will be the first message in the array.
     */
    forwardMessages(
        toChatId: InputPeerLike,
        fromChatId: InputPeerLike,
        messages: number[],
        params?: {
            /**
             * Optionally, a caption for your forwarded message(s).
             * It will be sent as a separate message before the forwarded messages.
             *
             * You can either pass `caption` or `captionMedia`, passing both will
             * result in an error
             */
            caption?: string

            /**
             * Optionally, a media caption for your forwarded message(s).
             * It will be sent as a separate message before the forwarded messages.
             *
             * You can either pass `caption` or `captionMedia`, passing both will
             * result in an error
             */
            captionMedia?: InputMediaLike

            /**
             * Parse mode to use to parse entities in caption.
             * Defaults to current default parse mode (if any).
             *
             * Passing `null` will explicitly disable formatting.
             */
            parseMode?: string | null

            /**
             * List of formatting entities in caption to use instead
             * of parsing via a parse mode.
             *
             * **Note:** Passing this makes the method ignore {@link parseMode}
             */
            entities?: tl.TypeMessageEntity[]

            /**
             * Whether to forward silently (also applies to caption message).
             */
            silent?: boolean

            /**
             * If set, the forwarding will be scheduled to this date
             * (also applies to caption message).
             * When passing a number, a UNIX time in ms is expected.
             */
            schedule?: Date | number

            /**
             * Whether to clear draft after sending this message (only used for caption)
             *
             * Defaults to `false`
             */
            clearDraft?: boolean
        }
    ): Promise<MaybeArray<Message>>
    /**
     * Retrieve a chunk of the chat history.
     *
     * You can get up to 100 messages with one call.
     * For larger chunks, use {@link iterHistory}.
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param params  Additional fetch parameters
     */
    getHistory(
        chatId: InputPeerLike,
        params?: {
            /**
             * Limits the number of messages to be retrieved.
             *
             * Defaults to `100`.
             */
            limit?: number

            /**
             * Sequential number of the first message to be returned.
             * Defaults to 0 (most recent message).
             *
             * Negative values are also accepted and are useful
             * in case you set `offsetId` or `offsetDate`.
             */
            offset?: number

            /**
             * Pass a message identifier as an offset to retrieve
             * only older messages starting from that message
             */
            offsetId?: number

            /**
             * Pass a date (`Date` or Unix time in ms) as an offset to retrieve
             * only older messages starting from that date.
             */
            offsetDate?: number | Date

            /**
             * Pass `true` to retrieve messages in reversed order (from older to recent)
             */
            reverse?: boolean
        }
    ): Promise<Message[]>
    /**
     * Get all messages inside of a message group
     *
     * @param chatId  Chat ID
     * @param message  ID of one of the messages in the group

     */
    getMessageGroup(chatId: InputPeerLike, message: number): Promise<Message[]>
    /**
     * Get a single message in chat by its ID
     *
     * **Note**: this method might return empty message
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
     * @param messageId  Messages ID
     * @param [fromReply=false]
     *     Whether the reply to a given message should be fetched
     *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
     */
    getMessages(
        chatId: InputPeerLike,
        messageId: number,
        fromReply?: boolean
    ): Promise<Message>
    /**
     * Get messages in chat by their IDs
     *
     * **Note**: this method might return empty messages
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
     * @param messageIds  Messages IDs
     * @param [fromReply=false]
     *     Whether the reply to a given message should be fetched
     *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
     */
    getMessages(
        chatId: InputPeerLike,
        messageIds: number[],
        fromReply?: boolean
    ): Promise<Message[]>
    /**
     * Iterate through a chat history sequentially.
     *
     * This method wraps {@link getHistory} to allow processing large
     * groups of messages or entire chats.
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param params  Additional fetch parameters
     */
    iterHistory(
        chatId: InputPeerLike,
        params?: {
            /**
             * Limits the number of messages to be retrieved.
             *
             * By default, no limit is applied and all messages
             * are returned.
             */
            limit?: number

            /**
             * Sequential number of the first message to be returned.
             * Defaults to 0 (most recent message).
             *
             * Negative values are also accepted and are useful
             * in case you set `offsetId` or `offsetDate`.
             */
            offset?: number

            /**
             * Pass a message identifier as an offset to retrieve
             * only older messages starting from that message
             */
            offsetId?: number

            /**
             * Pass a date (`Date` or Unix time in ms) as an offset to retrieve
             * only older messages starting from that date.
             */
            offsetDate?: number | Date

            /**
             * Pass `true` to retrieve messages in reversed order (from older to recent)
             */
            reverse?: boolean

            /**
             * Chunk size, which will be passed as `limit` parameter
             * to {@link getHistory}. Usually you shouldn't care about this.
             *
             * Defaults to `100`
             */
            chunkSize?: number
        }
    ): AsyncIterableIterator<Message>
    /**
     * Pin a message in a group, supergroup, channel or PM.
     *
     * For supergroups/channels, you must have appropriate permissions,
     * either as an admin, or as default permissions
     *
     * @param chatId  Chat ID, username, phone number, `"self"` or `"me"`
     * @param messageId  Message ID
     * @param notify  (default: `false`) Whether to send a notification (only for legacy groups and supergroups)
     * @param bothSides  (default: `false`) Whether to pin for both sides (only for private chats)
     */
    pinMessage(
        chatId: InputPeerLike,
        messageId: number,
        notify?: boolean,
        bothSides?: boolean
    ): Promise<void>
    /**
     * Search for messages globally from all of your chats
     *
     * **Note**: Due to Telegram limitations, you can only get up to ~10000 messages
     *
     * @param params  Search parameters
     */
    searchGlobal(params?: {
        /**
         * Text query string. Use `"@"` to search for mentions.
         *
         * Defaults to `""` (empty string)
         */
        query?: string

        /**
         * Limits the number of messages to be retrieved.
         *
         * By default, no limit is applied and all messages are returned
         */
        limit?: number

        /**
         * Filter the results using some filter.
         * Defaults to {@link SearchFilters.Empty} (i.e. will return all messages)
         *
         * @link SearchFilters
         */
        filter?: tl.TypeMessagesFilter

        /**
         * Chunk size, which will be passed as `limit` parameter
         * for `messages.search`. Usually you shouldn't care about this.
         *
         * Defaults to `100`
         */
        chunkSize?: number
    }): AsyncIterableIterator<Message>
    /**
     * Search for messages inside a specific chat
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param params  Additional search parameters
     */
    searchMessages(
        chatId: InputPeerLike,
        params?: {
            /**
             * Text query string. Required for text-only messages,
             * optional for media.
             *
             * Defaults to `""` (empty string)
             */
            query?: string

            /**
             * Sequential number of the first message to be returned.
             *
             * Defaults to `0`.
             */
            offset?: number

            /**
             * Limits the number of messages to be retrieved.
             *
             * By default, no limit is applied and all messages are returned
             */
            limit?: number

            /**
             * Filter the results using some filter.
             * Defaults to {@link SearchFilters.Empty} (i.e. will return all messages)
             *
             * @link SearchFilters
             */
            filter?: tl.TypeMessagesFilter

            /**
             * Search for messages sent by a specific user.
             *
             * Pass their marked ID, username, phone or `"me"` or `"self"`
             */
            fromUser?: InputPeerLike

            /**
             * Chunk size, which will be passed as `limit` parameter
             * for `messages.search`. Usually you shouldn't care about this.
             *
             * Defaults to `100`
             */
            chunkSize?: number
        }
    ): AsyncIterableIterator<Message>
    /**
     * Copy a message (i.e. send the same message,
     * but do not forward it).
     *
     * Note that if the message contains a webpage,
     * it will be copied simply as a text message,
     * and if the message contains an invoice,
     * it can't be copied.
     *
     * > **Note**: if you already have {@link Message} object,
     * > use {@link Message.sendCopy} instead, since that is
     * > much more efficient, and that is what this method wraps.
     *
     * @param toChatId  Source chat ID
     * @param fromChatId  Target chat ID
     * @param message  Message ID to forward
     * @param params

     */
    sendCopy(
        toChatId: InputPeerLike,
        fromChatId: InputPeerLike,
        message: number,
        params?: {
            /**
             * Whether to send this message silently.
             */
            silent?: boolean

            /**
             * If set, the message will be scheduled to this date.
             * When passing a number, a UNIX time in ms is expected.
             */
            schedule?: Date | number

            /**
             * New message caption (only used for media)
             */
            caption?: string

            /**
             * Parse mode to use to parse `text` entities before sending
             * the message. Defaults to current default parse mode (if any).
             *
             * Passing `null` will explicitly disable formatting.
             */
            parseMode?: string | null

            /**
             * Message to reply to. Either a message object or message ID.
             */
            replyTo?: number | Message

            /**
             * List of formatting entities to use instead of parsing via a
             * parse mode.
             *
             * **Note:** Passing this makes the method ignore {@link parseMode}
             */
            entities?: tl.TypeMessageEntity[]

            /**
             * For bots: inline or reply markup or an instruction
             * to hide a reply keyboard or to force a reply.
             */
            replyMarkup?: ReplyMarkup

            /**
             * Whether to clear draft after sending this message.
             *
             * Defaults to `false`
             */
            clearDraft?: boolean
        }
    ): Promise<Message>
    /**
     * Send a group of media.
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param medias  Medias contained in the message.
     * @param params  Additional sending parameters
     * @link InputMedia
     */
    sendMediaGroup(
        chatId: InputPeerLike,
        medias: InputMediaLike[],
        params?: {
            /**
             * Message to reply to. Either a message object or message ID.
             */
            replyTo?: number | Message

            /**
             * Parse mode to use to parse entities before sending
             * the message. Defaults to current default parse mode (if any).
             *
             * Passing `null` will explicitly disable formatting.
             */
            parseMode?: string | null

            /**
             * Whether to send this message silently.
             */
            silent?: boolean

            /**
             * If set, the message will be scheduled to this date.
             * When passing a number, a UNIX time in ms is expected.
             */
            schedule?: Date | number

            /**
             * For bots: inline or reply markup or an instruction
             * to hide a reply keyboard or to force a reply.
             */
            replyMarkup?: ReplyMarkup

            /**
             * Function that will be called after some part has been uploaded.
             * Only used when a file that requires uploading is passed,
             * and not used when uploading a thumbnail.
             *
             * @param index  Index of the media in the original array
             * @param uploaded  Number of bytes already uploaded
             * @param total  Total file size
             */
            progressCallback?: (
                index: number,
                uploaded: number,
                total: number
            ) => void

            /**
             * Whether to clear draft after sending this message.
             *
             * Defaults to `false`
             */
            clearDraft?: boolean
        }
    ): Promise<Message>
    /**
     * Send a single media (a photo or a document-based media)
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param media
     *     Media contained in the message. You can also pass TDLib
     *     and Bot API compatible File ID, which will be wrapped
     *     in {@link InputMedia.auto}
     * @param params  Additional sending parameters
     * @link InputMedia
     */
    sendMedia(
        chatId: InputPeerLike,
        media: InputMediaLike | string,
        params?: {
            /**
             * Message to reply to. Either a message object or message ID.
             */
            replyTo?: number | Message

            /**
             * Parse mode to use to parse entities before sending
             * the message. Defaults to current default parse mode (if any).
             *
             * Passing `null` will explicitly disable formatting.
             */
            parseMode?: string | null

            /**
             * Whether to send this message silently.
             */
            silent?: boolean

            /**
             * If set, the message will be scheduled to this date.
             * When passing a number, a UNIX time in ms is expected.
             */
            schedule?: Date | number

            /**
             * For bots: inline or reply markup or an instruction
             * to hide a reply keyboard or to force a reply.
             */
            replyMarkup?: ReplyMarkup

            /**
             * Function that will be called after some part has been uploaded.
             * Only used when a file that requires uploading is passed,
             * and not used when uploading a thumbnail.
             *
             * @param uploaded  Number of bytes already uploaded
             * @param total  Total file size
             */
            progressCallback?: (uploaded: number, total: number) => void

            /**
             * Whether to clear draft after sending this message.
             *
             * Defaults to `false`
             */
            clearDraft?: boolean
        }
    ): Promise<Message>
    /**
     * Send a text message
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param text  Text of the message
     * @param params  Additional sending parameters

     */
    sendText(
        chatId: InputPeerLike,
        text: string,
        params?: {
            /**
             * Message to reply to. Either a message object or message ID.
             */
            replyTo?: number | Message

            /**
             * Parse mode to use to parse entities before sending
             * the message. Defaults to current default parse mode (if any).
             *
             * Passing `null` will explicitly disable formatting.
             */
            parseMode?: string | null

            /**
             * List of formatting entities to use instead of parsing via a
             * parse mode.
             *
             * **Note:** Passing this makes the method ignore {@link parseMode}
             */
            entities?: tl.TypeMessageEntity[]

            /**
             * Whether to disable links preview in this message
             */
            disableWebPreview?: boolean

            /**
             * Whether to send this message silently.
             */
            silent?: boolean

            /**
             * If set, the message will be scheduled to this date.
             * When passing a number, a UNIX time in ms is expected.
             */
            schedule?: Date | number

            /**
             * For bots: inline or reply markup or an instruction
             * to hide a reply keyboard or to force a reply.
             */
            replyMarkup?: ReplyMarkup

            /**
             * Whether to clear draft after sending this message.
             *
             * Defaults to `false`
             */
            clearDraft?: boolean
        }
    ): Promise<Message>
    /**
     * Sends a current user/bot typing event
     * to a conversation partner or group.
     *
     * This status is set for 6 seconds, and is
     * automatically cancelled if you send a
     * message.
     *
     * @param chatId  Chat ID
     * @param status  (default: `'typing'`) Typing status
     * @param progress  (default: `0`) For `upload_*` and history import actions, progress of the upload
     */
    sendTyping(
        chatId: InputPeerLike,
        status?: TypingStatus | tl.TypeSendMessageAction,
        progress?: number
    ): Promise<void>
    /**
     * Send or retract a vote in a poll.
     *
     * @param chatId  Chat ID where this poll was found
     * @param message  Message ID where this poll was found
     * @param options
     *     Selected options, or `null` to retract.
     *     You can pass indexes of the answers or the `Buffer`s
     *     representing them. In case of indexes, the poll will first
     *     be requested from the server.
     */
    sendVote(
        chatId: InputPeerLike,
        message: number,
        options: null | MaybeArray<number | Buffer>
    ): Promise<Poll>
    /**
     * Unpin a message in a group, supergroup, channel or PM.
     *
     * For supergroups/channels, you must have appropriate permissions,
     * either as an admin, or as default permissions
     *
     * @param chatId  Chat ID, username, phone number, `"self"` or `"me"`
     * @param messageId  Message ID
     */
    unpinMessage(chatId: InputPeerLike, messageId: number): Promise<void>
    /**
     * Create a new takeout session
     *
     * @param params  Takeout session parameters
     */
    initTakeoutSession(
        params: Omit<tl.account.RawInitTakeoutSessionRequest, '_'>
    ): Promise<TakeoutSession>
    /**
     * Register a given {@link IMessageEntityParser} as a parse mode
     * for messages. When this method is first called, given parse
     * mode is also set as default.
     *
     * @param parseMode  Parse mode to register
     * @param name  (default: `parseMode.name`) Parse mode name. By default is taken from the object.
     * @throws MtCuteError  When the parse mode with a given name is already registered.
     */
    registerParseMode(parseMode: IMessageEntityParser, name?: string): void
    /**
     * Unregister a parse mode by its name.
     * Will silently fail if given parse mode does not exist.
     *
     * Also updates the default parse mode to the next one available, if any
     *
     * @param name  Name of the parse mode to unregister
     */
    unregisterParseMode(name: string): void
    /**
     * Get a {@link IMessageEntityParser} registered under a given name (or a default one).
     *
     * @param name  Name of the parse mode which parser to get.
     * @throws MtCuteError  When the provided parse mode is not registered
     * @throws MtCuteError  When `name` is omitted and there is no default parse mode
     */
    getParseMode(name?: string | null): IMessageEntityParser
    /**
     * Set a given parse mode as a default one.
     *
     * @param name  Name of the parse mode
     * @throws MtCuteError  When given parse mode is not registered.
     */
    setDefaultParseMode(name: string): void
    /**
     * Change your 2FA password
     *
     * @param currentPassword  Current password as plaintext
     * @param newPassword  New password as plaintext
     * @param hint  Hint for the new password
     */
    changeCloudPassword(
        currentPassword: string,
        newPassword: string,
        hint?: string
    ): Promise<void>
    /**
     * Enable 2FA password on your account
     *
     * Note that if you pass `email`, `EmailUnconfirmedError` may be
     * thrown, and you should use {@link verifyPasswordEmail},
     * {@link resendPasswordEmail} or {@link cancelPasswordEmail},
     * and the call this method again
     *
     * @param password  2FA password as plaintext
     * @param hint  Hint for the new password
     * @param email  Recovery email
     */
    enableCloudPassword(
        password: string,
        hint?: string,
        email?: string
    ): Promise<void>
    /**
     * Verify an email to use as 2FA recovery method
     *
     * @param code  Code which was sent via email
     */
    verifyPasswordEmail(code: string): Promise<void>
    /**
     * Resend the code to verify an email to use as 2FA recovery method.
     *
     */
    resendPasswordEmail(): Promise<void>
    /**
     * Cancel the code that was sent to verify an email to use as 2FA recovery method
     *
     */
    cancelPasswordEmail(): Promise<void>
    /**
     * Remove 2FA password from your account
     *
     * @param password  2FA password as plaintext
     */
    removeCloudPassword(password: string): Promise<void>
    /**
     * Add a sticker to a sticker set.
     *
     * Only for bots, and the sticker set must
     * have been created by this bot.
     *
     * @param id  Sticker set short name or TL object with input sticker set
     * @param sticker  Sticker to be added
     * @param params
     * @returns  Modfiied sticker set
     */
    addStickerToSet(
        id: string | tl.TypeInputStickerSet,
        sticker: InputStickerSetItem,
        params?: {
            /**
             * Upload progress callback
             *
             * @param uploaded  Number of bytes uploaded
             * @param total  Total file size
             */
            progressCallback?: (uploaded: number, total: number) => void
        }
    ): Promise<StickerSet>
    /**
     * Create a new sticker set (only for bots)
     *
     * Only for bots.
     *
     * @param params
     * @returns  Newly created sticker set
     */
    createStickerSet(params: {
        /**
         * Owner of the sticker set (must be user)
         */
        owner: InputPeerLike

        /**
         * Title of the sticker set (1-64 chars)
         */
        title: string

        /**
         * Short name of the sticker set.
         * Can only contain English letters, digits and underscores
         * (i.e. must match `/^[a-zA-Z0-9_]+$/),
         * and must end with `_by_<bot username>` (`<bot username>` is
         * case-insensitive).
         */
        shortName: string

        /**
         * Whether this is a set of masks
         */
        masks?: boolean

        /**
         * Whether this is a set of animated stickers
         */
        animated?: boolean

        /**
         * List of stickers to be immediately added into the pack.
         * There must be at least one sticker in this list.
         */
        stickers: InputStickerSetItem[]

        /**
         * Thumbnail for the set.
         *
         * The file must be either a `.png` file
         * up to 128kb, having size of exactly `100x100` px,
         * or a `.tgs` file up to 32kb.
         *
         * If not set, Telegram will use the first sticker
         * in the sticker set as the thumbnail
         */
        thumb?: InputFileLike

        /**
         * Upload progress callback.
         *
         * @param idx  Index of the sticker
         * @param uploaded  Number of bytes uploaded
         * @param total  Total file size
         */
        progressCallback?: (
            idx: number,
            uploaded: number,
            total: number
        ) => void
    }): Promise<StickerSet>
    /**
     * Delete a sticker from a sticker set
     *
     * Only for bots, and the sticker set must
     * have been created by this bot.
     *
     * @param sticker
     *     TDLib and Bot API compatible File ID, or a
     *     TL object representing a sticker to be removed
     * @returns  Modfiied sticker set
     */
    deleteStickerFromSet(
        sticker:
            | string
            | tdFileId.RawFullRemoteFileLocation
            | tl.TypeInputDocument
    ): Promise<StickerSet>
    /**
     * Get a list of all installed sticker packs
     *
     * > **Note**: This method returns *brief* meta information about
     * > the packs, that does not include the stickers themselves.
     * > Use {@link StickerSet.getFull} or {@link getStickerSet}
     * > to get a stickerset that will include the stickers
     *
     */
    getInstalledStickers(): Promise<StickerSet[]>
    /**
     * Get a sticker pack and stickers inside of it.
     *
     * @param id  Sticker pack short name, dice emoji, `"emoji"` for animated emojis or input ID
     */
    getStickerSet(
        id: string | { dice: string } | tl.TypeInputStickerSet
    ): Promise<StickerSet>
    /**
     * Move a sticker in a sticker set
     * to another position
     *
     * Only for bots, and the sticker set must
     * have been created by this bot.
     *
     * @param sticker
     *     TDLib and Bot API compatible File ID, or a
     *     TL object representing a sticker to be removed
     * @param position  New sticker position (starting from 0)
     * @returns  Modfiied sticker set
     */
    moveStickerInSet(
        sticker:
            | string
            | tdFileId.RawFullRemoteFileLocation
            | tl.TypeInputDocument,
        position: number
    ): Promise<StickerSet>
    /**
     * Set sticker set thumbnail
     *
     * @param id  Sticker set short name or a TL object with input sticker set
     * @param thumb  Sticker set thumbnail
     * @param params
     * @returns  Modified sticker set
     */
    setStickerSetThumb(
        id: string | tl.TypeInputStickerSet,
        thumb: InputFileLike | tl.TypeInputDocument,
        params?: {
            /**
             * Upload progress callback
             *
             * @param uploaded  Number of bytes uploaded
             * @param total  Total file size
             */
            progressCallback?: (uploaded: number, total: number) => void
        }
    ): Promise<StickerSet>
    /**
     * Base function for update handling. Replace or override this function
     * and implement your own update handler, and call this function
     * to handle externally obtained or manually crafted updates.
     *
     * Note that this function is called every time an `Update` is received,
     * not `Updates`. Low-level updates containers are parsed by the library,
     * and you receive ready to use updates and related entities.
     * Also note that entity maps may contain entities that are not
     * used in this particular update, so do not rely on its contents.
     *
     * `update` might contain a Message object - in this case,
     * it should be interpreted as some kind of `updateNewMessage`.
     *
     * @param update  Update that has just happened
     * @param users  Map of users in this update
     * @param chats  Map of chats in this update
     */
    dispatchUpdate(
        update: tl.TypeUpdate | tl.TypeMessage,
        users: UsersIndex,
        chats: ChatsIndex
    ): void
    /**
     * Catch up with the server by loading missed updates.
     *
     */
    catchUp(): Promise<void>
    /**
     * Block a user
     *
     * @param id  User ID, username or phone number
     */
    blockUser(id: InputPeerLike): Promise<void>
    /**
     * Delete your own profile photos
     *
     * @param ids  ID(s) of the photos. Can be file IDs or raw TL objects
     */
    deleteProfilePhotos(
        ids: MaybeArray<string | tl.TypeInputPhoto>
    ): Promise<void>
    /**
     * Get a list of common chats you have with a given user
     *
     * @param userId  User's ID, username or phone number
     * @throws MtCuteInvalidPeerTypeError
     */
    getCommonChats(userId: InputPeerLike): Promise<Chat[]>
    /**
     * Get currently authorized user's full information
     *
     */
    getMe(): Promise<User>
    /**
     * Get a list of profile pictures of a user
     *
     * @param userId  User ID, username, phone number, `"me"` or `"self"`
     * @param params
     */
    getProfilePhotos(
        userId: InputPeerLike,
        params?: {
            /**
             * Offset from which to fetch.
             *
             * Defaults to `0`
             */
            offset?: number

            /**
             * Maximum number of items to fetch (up to 100)
             *
             * Defaults to `100`
             */
            limit?: number
        }
    ): Promise<Photo[]>
    /**
     * Get information about a single user.
     *
     * @param id  User's identifier. Can be ID, username, phone number, `"me"` or `"self"` or TL object
     */
    getUsers(id: InputPeerLike): Promise<User>
    /**
     * Get information about multiple users.
     * You can retrieve up to 200 users at once
     *
     * @param ids  Users' identifiers. Can be ID, username, phone number, `"me"`, `"self"` or TL object
     */
    getUsers(ids: InputPeerLike[]): Promise<User[]>
    /**
     * Iterate over profile photos
     *
     * @param userId  User ID, username, phone number, `"me"` or `"self"`
     * @param params
     */
    iterProfilePhotos(
        userId: InputPeerLike,
        params?: {
            /**
             * Offset from which to fetch.
             *
             * Defaults to `0`
             */
            offset?: number

            /**
             * Maximum number of items to fetch
             *
             * Defaults to `Infinity`, i.e. all items are fetched
             */
            limit?: number

            /**
             * Size of chunks which are fetched. Usually not needed.
             *
             * Defaults to `100`
             */
            chunkSize?: number

            /**
             * If set, the method will return only photos
             * with IDs less than the set one
             */
            maxId?: tl.Long
        }
    ): AsyncIterableIterator<Photo>
    /**
     * Get multiple `InputPeer`s at once,
     * while also normalizing and removing
     * peers that can't be normalized to that type.
     * Uses `async-eager-pool` internally, with a
     * limit of 10.
     *
     * @param peerIds  Peer Ids
     * @param normalizer  Normalization function
     */
    resolvePeerMany<
        T extends tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel
    >(
        peerIds: InputPeerLike[],
        normalizer: (
            obj: tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel
        ) => T | null
    ): Promise<T[]>
    /**
     * Get multiple `InputPeer`s at once.
     * Uses `async-eager-pool` internally, with a
     * limit of 10.
     *
     * @param peerIds  Peer Ids
     */
    resolvePeerMany(
        peerIds: InputPeerLike[]
    ): Promise<(tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel)[]>
    /**
     * Get the `InputPeer` of a known peer id.
     * Useful when an `InputPeer` is needed.
     *
     * @param peerId  The peer identifier that you want to extract the `InputPeer` from.
     */
    resolvePeer(
        peerId: InputPeerLike
    ): Promise<tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel>
    /**
     * Change user status to offline or online
     *
     * @param offline  (default: `true`) Whether the user is currently offline
     */
    setOffline(offline?: boolean): Promise<void>
    /**
     * Set a new profile photo or video.
     *
     * @param type  Media type (photo or video)
     * @param media  Input media file
     * @param previewSec
     *   When `type = video`, timestamp in seconds which will be shown
     *   as a static preview.
     */
    setProfilePhoto(
        type: 'photo' | 'video',
        media: InputFileLike,
        previewSec?: number
    ): Promise<Photo>
    /**
     * Unblock a user
     *
     * @param id  User ID, username or phone number
     */
    unblockUser(id: InputPeerLike): Promise<void>
    /**
     * Update your profile details.
     *
     * Only pass fields that you want to change.
     *
     * @param params
     */
    updateProfile(params: {
        /**
         * New first name
         */
        firstName?: string

        /**
         * New last name. Pass `''` (empty string) to remove it
         */
        lastName?: string

        /**
         * New bio (max 70 chars). Pass `''` (empty string) to remove it
         */
        bio?: string
    }): Promise<User>
    /**
     * Change username of the current user.
     *
     * Note that bots usernames must be changed through
     * bot support or re-created from scratch.
     *
     * @param username  New username (5-32 chars, allowed chars: `a-zA-Z0-9_`), or `null` to remove
     */
    updateUsername(username: string | null): Promise<User>
}
/** @internal */
export class TelegramClient extends BaseTelegramClient {
    protected _userId: number | null
    protected _isBot: boolean
    protected _downloadConnections: Record<number, TelegramConnection>
    protected _connectionsForInline: Record<number, TelegramConnection>
    protected _parseModes: Record<string, IMessageEntityParser>
    protected _defaultParseMode: string | null
    protected _updLock: Lock
    protected _pts: number
    protected _date: number
    protected _cpts: Record<number, number>
    constructor(opts: BaseTelegramClient.Options) {
        super(opts)
        this._userId = null
        this._isBot = false
        this._downloadConnections = {}
        this._connectionsForInline = {}
        this._parseModes = {}
        this._defaultParseMode = null
        this._updLock = new Lock()
        // we dont need to initialize state fields since
        // they are always loaded either from the server, or from storage.

        // channel PTS are not loaded immediately, and instead are cached here
        // after the first time they were retrieved from the storage.
        // they are later pushed into the storage.
        this._cpts = {}
    }

    acceptTos = acceptTos
    checkPassword = checkPassword
    getPasswordHint = getPasswordHint
    logOut = logOut
    recoverPassword = recoverPassword
    resendCode = resendCode
    run = run
    sendCode = sendCode
    sendRecoveryCode = sendRecoveryCode
    signInBot = signInBot
    signIn = signIn
    signUp = signUp
    startTest = startTest
    start = start
    answerCallbackQuery = answerCallbackQuery
    answerInlineQuery = answerInlineQuery
    addChatMembers = addChatMembers
    archiveChats = archiveChats
    createChannel = createChannel
    createGroup = createGroup
    createSupergroup = createSupergroup
    deleteChannel = deleteChannel
    deleteSupergroup = deleteChannel
    deleteChatPhoto = deleteChatPhoto
    deleteGroup = deleteGroup
    deleteHistory = deleteHistory
    deleteUserHistory = deleteUserHistory
    getChatEventLog = getChatEventLog
    getChatMember = getChatMember
    getChatMembers = getChatMembers
    getChatPreview = getChatPreview
    getChat = getChat
    getFullChat = getFullChat
    getNearbyChats = getNearbyChats
    iterChatMembers = iterChatMembers
    joinChat = joinChat
    leaveChat = leaveChat
    saveDraft = saveDraft
    setChatDefaultPermissions = setChatDefaultPermissions
    setChatDescription = setChatDescription
    setChatPhoto = setChatPhoto
    setChatTitle = setChatTitle
    setChatUsername = setChatUsername
    setSlowMode = setSlowMode
    unarchiveChats = unarchiveChats
    addContact = addContact
    deleteContacts = deleteContacts
    getContacts = getContacts
    importContacts = importContacts
    createFolder = createFolder
    deleteFolder = deleteFolder
    editFolder = editFolder
    findFolder = findFolder
    getDialogs = getDialogs
    getFolders = getFolders
    downloadAsBuffer = downloadAsBuffer
    downloadToFile = downloadToFile
    downloadAsIterable = downloadAsIterable
    downloadAsStream = downloadAsStream
    protected _normalizeFileToDocument = _normalizeFileToDocument
    protected _normalizeInputFile = _normalizeInputFile
    protected _normalizeInputMedia = _normalizeInputMedia
    uploadFile = uploadFile
    createInviteLink = createInviteLink
    editInviteLink = editInviteLink
    exportInviteLink = exportInviteLink
    getInviteLinkMembers = getInviteLinkMembers
    getInviteLink = getInviteLink
    getInviteLinks = getInviteLinks
    getPrimaryInviteLink = getPrimaryInviteLink
    revokeInviteLink = revokeInviteLink
    closePoll = closePoll
    deleteMessages = deleteMessages
    editInlineMessage = editInlineMessage
    editMessage = editMessage
    protected _findMessageInUpdate = _findMessageInUpdate
    forwardMessages = forwardMessages
    getHistory = getHistory
    getMessageGroup = getMessageGroup
    getMessages = getMessages
    iterHistory = iterHistory
    protected _parseEntities = _parseEntities
    pinMessage = pinMessage
    searchGlobal = searchGlobal
    searchMessages = searchMessages
    sendCopy = sendCopy
    sendMediaGroup = sendMediaGroup
    sendMedia = sendMedia
    sendText = sendText
    sendTyping = sendTyping
    sendVote = sendVote
    unpinMessage = unpinMessage
    initTakeoutSession = initTakeoutSession
    registerParseMode = registerParseMode
    unregisterParseMode = unregisterParseMode
    getParseMode = getParseMode
    setDefaultParseMode = setDefaultParseMode
    changeCloudPassword = changeCloudPassword
    enableCloudPassword = enableCloudPassword
    verifyPasswordEmail = verifyPasswordEmail
    resendPasswordEmail = resendPasswordEmail
    cancelPasswordEmail = cancelPasswordEmail
    removeCloudPassword = removeCloudPassword
    addStickerToSet = addStickerToSet
    createStickerSet = createStickerSet
    deleteStickerFromSet = deleteStickerFromSet
    getInstalledStickers = getInstalledStickers
    getStickerSet = getStickerSet
    moveStickerInSet = moveStickerInSet
    setStickerSetThumb = setStickerSetThumb
    protected _fetchUpdatesState = _fetchUpdatesState
    protected _loadStorage = _loadStorage
    protected _saveStorage = _saveStorage
    dispatchUpdate = dispatchUpdate
    protected _handleUpdate = _handleUpdate
    catchUp = catchUp
    blockUser = blockUser
    deleteProfilePhotos = deleteProfilePhotos
    getCommonChats = getCommonChats
    getMe = getMe
    getProfilePhotos = getProfilePhotos
    getUsers = getUsers
    iterProfilePhotos = iterProfilePhotos
    resolvePeerMany = resolvePeerMany
    resolvePeer = resolvePeer
    setOffline = setOffline
    setProfilePhoto = setProfilePhoto
    unblockUser = unblockUser
    updateProfile = updateProfile
    updateUsername = updateUsername
}
