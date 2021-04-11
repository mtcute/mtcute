/* THIS FILE WAS AUTO-GENERATED */
import { BaseTelegramClient } from '@mtcute/core'
import { tl } from '@mtcute/tl'
import { acceptTos } from './methods/auth/accept-tos'
import { checkPassword } from './methods/auth/check-password'
import { getPasswordHint } from './methods/auth/get-password-hint'
import { logOut } from './methods/auth/log-out'
import { recoverPassword } from './methods/auth/recover-password'
import { resendCode } from './methods/auth/resend-code'
import { sendCode } from './methods/auth/send-code'
import { sendRecoveryCode } from './methods/auth/send-recovery-code'
import { signInBot } from './methods/auth/sign-in-bot'
import { signIn } from './methods/auth/sign-in'
import { signUp } from './methods/auth/sign-up'
import { start } from './methods/auth/start'
import { addChatMembers } from './methods/chats/add-chat-members'
import { archiveChats } from './methods/chats/archive-chats'
import { createChannel } from './methods/chats/create-channel'
import { createGroup } from './methods/chats/create-group'
import { createSupergroup } from './methods/chats/create-supergroup'
import { deleteChannel } from './methods/chats/delete-channel'
import { deleteChatPhoto } from './methods/chats/delete-chat-photo'
import { deleteGroup } from './methods/chats/delete-group'
import { deleteHistory } from './methods/chats/delete-history'
import { getChatMember } from './methods/chats/get-chat-member'
import { getChatPreview } from './methods/chats/get-chat-preview'
import { getChat } from './methods/chats/get-chat'
import { getFullChat } from './methods/chats/get-full-chat'
import { joinChat } from './methods/chats/join-chat'
import { leaveChat } from './methods/chats/leave-chat'
import { setChatDefaultPermissions } from './methods/chats/set-chat-default-permissions'
import { setChatDescription } from './methods/chats/set-chat-description'
import { setChatPhoto } from './methods/chats/set-chat-photo'
import { setChatTitle } from './methods/chats/set-chat-title'
import { setSlowMode } from './methods/chats/set-slow-mode'
import { unarchiveChats } from './methods/chats/unarchive-chats'
import { downloadAsBuffer } from './methods/files/download-buffer'
import { downloadToFile } from './methods/files/download-file'
import { downloadAsIterable } from './methods/files/download-iterable'
import { downloadAsStream } from './methods/files/download-stream'
import { uploadFile } from './methods/files/upload-file'
import { deleteMessages } from './methods/messages/delete-messages'
import { editMessage } from './methods/messages/edit-message'
import { _findMessageInUpdate } from './methods/messages/find-in-update'
import { getHistory } from './methods/messages/get-history'
import { getMessages } from './methods/messages/get-messages'
import { iterHistory } from './methods/messages/iter-history'
import { _parseEntities } from './methods/messages/parse-entities'
import { pinMessage } from './methods/messages/pin-message'
import { searchGlobal } from './methods/messages/search-global'
import { searchMessages } from './methods/messages/search-messages'
import { sendDice } from './methods/messages/send-dice'
import { sendLocation } from './methods/messages/send-location'
import { sendMedia } from './methods/messages/send-media'
import { sendPhoto } from './methods/messages/send-photo'
import { sendText } from './methods/messages/send-text'
import { unpinMessage } from './methods/messages/unpin-message'
import {
    getParseMode,
    registerParseMode,
    setDefaultParseMode,
    unregisterParseMode,
} from './methods/parse-modes/parse-modes'
import { catchUp } from './methods/updates/catch-up'
import {
    _dispatchUpdate,
    addUpdateHandler,
    removeUpdateHandler,
} from './methods/updates/dispatcher'
import { _handleUpdate } from './methods/updates/handle-update'
import { onNewMessage } from './methods/updates/on-new-message'
import { blockUser } from './methods/users/block-user'
import { getCommonChats } from './methods/users/get-common-chats'
import { getMe } from './methods/users/get-me'
import { getUsers } from './methods/users/get-users'
import { resolvePeer } from './methods/users/resolve-peer'
import { IMessageEntityParser } from './parser'
import { Readable } from 'stream'
import {
    Chat,
    ChatMember,
    ChatPreview,
    FileDownloadParameters,
    InputChatPermissions,
    InputFileLike,
    InputMediaLike,
    InputPeerLike,
    MaybeDynamic,
    Message,
    PropagationSymbol,
    ReplyMarkup,
    SentCode,
    TermsOfService,
    UpdateFilter,
    UpdateHandler,
    UploadFileLike,
    UploadedFile,
    User,
    filters,
    handlers,
} from './types'
import { MaybeArray, MaybeAsync, TelegramConnection } from '@mtcute/core'

export class TelegramClient extends BaseTelegramClient {
    // from methods/files/_initialize.ts
    protected _downloadConnections: Record<number, TelegramConnection>

    // from methods/parse-modes/_initialize.ts
    protected _parseModes: Record<string, IMessageEntityParser>

    // from methods/parse-modes/_initialize.ts
    protected _defaultParseMode: string | null

    // from methods/updates/dispatcher.ts
    protected _groups: Record<number, UpdateHandler[]>

    // from methods/updates/dispatcher.ts
    protected _groupsOrder: number[]

    constructor(opts: BaseTelegramClient.Options) {
        super(opts)
        this._downloadConnections = {}
        this._parseModes = {}
        this._defaultParseMode = null
        this._groups = {}
        this._groupsOrder = []
    }

    /**
     * Accept the given TOS
     *
     * @param tosId  TOS id
     */
    acceptTos(tosId: string): Promise<boolean> {
        return acceptTos.apply(this, arguments)
    }
    /**
     * Check your Two-Step verification password and log in
     *
     * @param password  Your Two-Step verification password
     * @returns  The authorized user
     * @throws BadRequestError  In case the password is invalid
     */
    checkPassword(password: string): Promise<User> {
        return checkPassword.apply(this, arguments)
    }
    /**
     * Get your Two-Step Verification password hint.
     *
     * @returns  The password hint as a string, if any
     */
    getPasswordHint(): Promise<string | null> {
        return getPasswordHint.apply(this, arguments)
    }
    /**
     * Log out from Telegram account and optionally reset the session storage.
     *
     * When you log out, you can immediately log back in using
     * the same {@link TelegramClient} instance.
     *
     * @param resetSession  (default: `false`) Whether to reset the session
     * @returns  On success, `true` is returned
     */
    logOut(resetSession?: boolean): Promise<true> {
        return logOut.apply(this, arguments)
    }
    /**
     * Recover your password with a recovery code and log in.
     *
     * @param recoveryCode  The recovery code sent via email
     * @returns  The authorized user
     * @throws BadRequestError  In case the code is invalid
     */
    recoverPassword(recoveryCode: string): Promise<User> {
        return recoverPassword.apply(this, arguments)
    }
    /**
     * Re-send the confirmation code using a different type.
     *
     * The type of the code to be re-sent is specified in the `nextType` attribute of
     * {@link SentCode} object returned by {@link sendCode}
     *
     * @param phone  Phone number in international format
     * @param phoneCodeHash  Confirmation code identifier from {@link SentCode}
     */
    resendCode(phone: string, phoneCodeHash: string): Promise<SentCode> {
        return resendCode.apply(this, arguments)
    }
    /**
     * Send the confirmation code to the given phone number
     *
     * @param phone  Phone number in international format.
     * @returns  An object containing information about the sent confirmation code
     */
    sendCode(phone: string): Promise<SentCode> {
        return sendCode.apply(this, arguments)
    }
    /**
     * Send a code to email needed to recover your password
     *
     * @returns  String containing email pattern to which the recovery code was sent
     */
    sendRecoveryCode(): Promise<string> {
        return sendRecoveryCode.apply(this, arguments)
    }
    /**
     * Authorize a bot using its token issued by [@BotFather](//t.me/BotFather)
     *
     * @param token  Bot token issued by BotFather
     * @returns  Bot's {@link User} object
     * @throws BadRequestError  In case the bot token is invalid
     */
    signInBot(token: string): Promise<User> {
        return signInBot.apply(this, arguments)
    }
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
    ): Promise<User | TermsOfService | false> {
        return signIn.apply(this, arguments)
    }
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
    ): Promise<User> {
        return signUp.apply(this, arguments)
    }
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
         * Note: you should register your handlers
         * before calling `start()`
         *
         * Defaults to true.
         */
        catchUp?: boolean
    }): Promise<User> {
        return start.apply(this, arguments)
    }
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
    ): Promise<void> {
        return addChatMembers.apply(this, arguments)
    }
    /**
     * Archive one or more chats
     *
     * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
     */
    archiveChats(chats: MaybeArray<InputPeerLike>): Promise<void> {
        return archiveChats.apply(this, arguments)
    }
    /**
     * Create a new broadcast channel
     *
     * @param title  Channel title
     * @param description  (default: `''`) Channel description
     * @returns  Newly created channel
     */
    createChannel(title: string, description?: string): Promise<Chat> {
        return createChannel.apply(this, arguments)
    }
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
    createGroup(
        title: string,
        users: MaybeArray<InputPeerLike>
    ): Promise<Chat> {
        return createGroup.apply(this, arguments)
    }
    /**
     * Create a new supergroup
     *
     * @param title  Title of the supergroup
     * @param description  (default: `''`) Description of the supergroup
     */
    createSupergroup(title: string, description?: string): Promise<Chat> {
        return createSupergroup.apply(this, arguments)
    }

    /**
     * Delete a channel or a supergroup
     *
     * @param chatId  Chat ID or username
     */
    deleteChannel(chatId: InputPeerLike): Promise<void> {
        return deleteChannel.apply(this, arguments)
    }

    /**
     * Delete a channel or a supergroup
     *
     * @param chatId  Chat ID or username
     */
    deleteSupergroup(chatId: InputPeerLike): Promise<void> {
        return deleteChannel.apply(this, arguments)
    }
    /**
     * Delete a chat photo
     *
     * You must be an administrator and have the appropriate permissions.
     *
     * @param chatId  Chat ID or username
     */
    deleteChatPhoto(chatId: InputPeerLike): Promise<void> {
        return deleteChatPhoto.apply(this, arguments)
    }
    /**
     * Delete a legacy group chat for all members
     *
     * @param chatId  Chat ID
     */
    deleteGroup(chatId: InputPeerLike): Promise<void> {
        return deleteGroup.apply(this, arguments)
    }
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
    ): Promise<void> {
        return deleteHistory.apply(this, arguments)
    }
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
    ): Promise<ChatMember> {
        return getChatMember.apply(this, arguments)
    }
    /**
     * Get preview information about a private chat.
     *
     * @param inviteLink  Invite link
     * @throws MtCuteArgumentError  In case invite link has invalid format
     * @throws MtCuteNotFoundError
     *   In case you are trying to get info about private chat that you have already joined.
     *   Use {@link getChat} or {@link getFullChat} instead.
     */
    getChatPreview(inviteLink: string): Promise<ChatPreview> {
        return getChatPreview.apply(this, arguments)
    }
    /**
     * Get basic information about a chat.
     *
     * @param chatId  ID of the chat, its username or invite link
     * @throws MtCuteArgumentError
     *   In case you are trying to get info about private chat that you haven't joined.
     *   Use {@link getChatPreview} instead.
     */
    getChat(chatId: InputPeerLike): Promise<Chat> {
        return getChat.apply(this, arguments)
    }
    /**
     * Get full information about a chat.
     *
     * @param chatId  ID of the chat, its username or invite link
     * @throws MtCuteArgumentError
     *   In case you are trying to get info about private chat that you haven't joined.
     *   Use {@link getChatPreview} instead.
     */
    getFullChat(chatId: InputPeerLike): Promise<Chat> {
        return getFullChat.apply(this, arguments)
    }
    /**
     * Join a channel or supergroup
     *
     * @param chatId
     *   Chat identifier. Either an invite link (`t.me/joinchat/*`), a username (`@username`)
     *   or ID of the linked supergroup or channel.
     */
    joinChat(chatId: InputPeerLike): Promise<Chat> {
        return joinChat.apply(this, arguments)
    }
    /**
     * Leave a group chat, supergroup or channel
     *
     * @param chatId  Chat ID or username
     * @param clear  (default: `false`) Whether to clear history after leaving (only for legacy group chats)
     */
    leaveChat(chatId: InputPeerLike, clear?: boolean): Promise<void> {
        return leaveChat.apply(this, arguments)
    }
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
    ): Promise<Chat> {
        return setChatDefaultPermissions.apply(this, arguments)
    }
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
    ): Promise<void> {
        return setChatDescription.apply(this, arguments)
    }
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
    ): Promise<void> {
        return setChatPhoto.apply(this, arguments)
    }
    /**
     * Change chat title
     *
     * You must be an administrator and have the appropriate permissions.
     *
     * @param chatId  Chat ID or username
     * @param title  New chat title, 1-255 characters
     */
    setChatTitle(chatId: InputPeerLike, title: string): Promise<void> {
        return setChatTitle.apply(this, arguments)
    }
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
    setSlowMode(chatId: InputPeerLike, seconds?: number): Promise<void> {
        return setSlowMode.apply(this, arguments)
    }
    /**
     * Unarchive one or more chats
     *
     * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
     */
    unarchiveChats(chats: MaybeArray<InputPeerLike>): Promise<void> {
        return unarchiveChats.apply(this, arguments)
    }
    /**
     * Download a file and return its contents as a Buffer.
     *
     * > **Note**: This method _will_ download the entire file
     * > into memory at once. This might cause an issue, so use wisely!
     *
     * @param params  File download parameters
     */
    downloadAsBuffer(params: FileDownloadParameters): Promise<Buffer> {
        return downloadAsBuffer.apply(this, arguments)
    }
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
    ): Promise<void> {
        return downloadToFile.apply(this, arguments)
    }
    /**
     * Download a file and return it as an iterable, which yields file contents
     * in chunks of a given size. Order of the chunks is guaranteed to be
     * consecutive.
     *
     * @param params  Download parameters
     */
    downloadAsIterable(
        params: FileDownloadParameters
    ): AsyncIterableIterator<Buffer> {
        return downloadAsIterable.apply(this, arguments)
    }
    /**
     * Download a file and return it as a Node readable stream,
     * streaming file contents.
     *
     * @param params  File download parameters
     */
    downloadAsStream(params: FileDownloadParameters): Readable {
        return downloadAsStream.apply(this, arguments)
    }
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
    }): Promise<UploadedFile> {
        return uploadFile.apply(this, arguments)
    }
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
    ): Promise<boolean> {
        return deleteMessages.apply(this, arguments)
    }
    /**
     * Edit message text and/or reply markup.
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
             */
            entities?: tl.TypeMessageEntity[]

            /**
             * Whether to disable links preview in this message
             */
            disableWebPreview?: boolean

            /**
             * For bots: inline or reply markup or an instruction
             * to hide a reply keyboard or to force a reply.
             */
            replyMarkup?: ReplyMarkup
        }
    ): Promise<Message> {
        return editMessage.apply(this, arguments)
    }

    protected _findMessageInUpdate(
        res: tl.TypeUpdates,
        isEdit?: boolean
    ): Message {
        return _findMessageInUpdate.apply(this, arguments)
    }
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
    ): Promise<Message[]> {
        return getHistory.apply(this, arguments)
    }
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

    getMessages(
        chatId: InputPeerLike,
        messageIds: MaybeArray<number>,
        fromReply?: boolean
    ): Promise<MaybeArray<Message>> {
        return getMessages.apply(this, arguments)
    }
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
    ): AsyncIterableIterator<Message> {
        return iterHistory.apply(this, arguments)
    }

    protected _parseEntities(
        text?: string,
        mode?: string | null,
        entities?: tl.TypeMessageEntity[]
    ): Promise<[string, tl.TypeMessageEntity[] | undefined]> {
        return _parseEntities.apply(this, arguments)
    }
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
    ): Promise<void> {
        return pinMessage.apply(this, arguments)
    }
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
    }): AsyncIterableIterator<Message> {
        return searchGlobal.apply(this, arguments)
    }
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
    ): AsyncIterableIterator<Message> {
        return searchMessages.apply(this, arguments)
    }
    /**
     * Send an animated dice with a random value.
     *
     * For convenience, known dice emojis are available
     * as static members of {@link Dice}.
     *
     * Note that dice result value is generated randomly on the server,
     * you can't influence it in any way!
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param emoji  Emoji representing a dice
     * @param params  Additional sending parameters
     * @link Dice
     */
    sendDice(
        chatId: InputPeerLike,
        emoji: string,
        params?: {
            /**
             * Message to reply to. Either a message object or message ID.
             */
            replyTo?: number | Message

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
        }
    ): Promise<Message> {
        return sendDice.apply(this, arguments)
    }
    /**
     * Send a static geo location.
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param latitude  Latitude of the location
     * @param longitude  Longitude of the location
     * @param params  Additional sending parameters
     */
    sendLocation(
        chatId: InputPeerLike,
        latitude: number,
        longitude: number,
        params?: {
            /**
             * Message to reply to. Either a message object or message ID.
             */
            replyTo?: number | Message

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
        }
    ): Promise<Message> {
        return sendLocation.apply(this, arguments)
    }
    /**
     * Send a single media.
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param media  Media contained in the message
     * @param params  Additional sending parameters
     */
    sendMedia(
        chatId: InputPeerLike,
        media: InputMediaLike,
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
        }
    ): Promise<Message> {
        return sendMedia.apply(this, arguments)
    }
    /**
     * Send a single photo
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param photo  Photo contained in the message.
     * @param params  Additional sending parameters
     */
    sendPhoto(
        chatId: InputPeerLike,
        photo: InputFileLike,
        params?: {
            /**
             * Caption for the photo
             */
            caption?: string

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
             * Self-Destruct timer.
             * If set, the photo will self-destruct in a given number
             * of seconds.
             */
            ttlSeconds?: number

            /**
             * Function that will be called after some part has been uploaded.
             * Only used when a file that requires uploading is passed.
             *
             * @param uploaded  Number of bytes already uploaded
             * @param total  Total file size
             */
            progressCallback?: (uploaded: number, total: number) => void
        }
    ): Promise<Message> {
        return sendPhoto.apply(this, arguments)
    }
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
        }
    ): Promise<Message> {
        return sendText.apply(this, arguments)
    }
    /**
     * Unpin a message in a group, supergroup, channel or PM.
     *
     * For supergroups/channels, you must have appropriate permissions,
     * either as an admin, or as default permissions
     *
     * @param chatId  Chat ID, username, phone number, `"self"` or `"me"`
     * @param messageId  Message ID
     */
    unpinMessage(chatId: InputPeerLike, messageId: number): Promise<void> {
        return unpinMessage.apply(this, arguments)
    }
    /**
     * Register a given {@link IMessageEntityParser} as a parse mode
     * for messages. When this method is first called, given parse
     * mode is also set as default.
     *
     * @param parseMode  Parse mode to register
     * @param name  (default: `parseMode.name`) Parse mode name. By default is taken from the object.
     * @throws MtCuteError  When the parse mode with a given name is already registered.
     */
    registerParseMode(parseMode: IMessageEntityParser, name?: string): void {
        return registerParseMode.apply(this, arguments)
    }
    /**
     * Unregister a parse mode by its name.
     * Will silently fail if given parse mode does not exist.
     *
     * Also updates the default parse mode to the next one available, if any
     *
     * @param name  Name of the parse mode to unregister
     */
    unregisterParseMode(name: string): void {
        return unregisterParseMode.apply(this, arguments)
    }
    /**
     * Get a {@link IMessageEntityParser} registered under a given name (or a default one).
     *
     * @param name  Name of the parse mode which parser to get.
     * @throws MtCuteError  When the provided parse mode is not registered
     * @throws MtCuteError  When `name` is omitted and there is no default parse mode
     */
    getParseMode(name?: string | null): IMessageEntityParser {
        return getParseMode.apply(this, arguments)
    }
    /**
     * Set a given parse mode as a default one.
     *
     * @param name  Name of the parse mode
     * @throws MtCuteError  When given parse mode is not registered.
     */
    setDefaultParseMode(name: string): void {
        return setDefaultParseMode.apply(this, arguments)
    }
    /**
     * Catch up with the server by loading missed updates.
     *
     */
    catchUp(): Promise<void> {
        return catchUp.apply(this, arguments)
    }
    protected _dispatchUpdate(
        update: tl.TypeUpdate,
        users: Record<number, tl.TypeUser>,
        chats: Record<number, tl.TypeChat>
    ): Promise<void> {
        return _dispatchUpdate.apply(this, arguments)
    }
    /**
     * Add an update handler to a given handlers group
     *
     * @param handler  Update handler
     * @param group  (default: `0`) Handler group index
     */
    addUpdateHandler(handler: UpdateHandler, group?: number): void {
        return addUpdateHandler.apply(this, arguments)
    }
    /**
     * Remove an update handler (or handlers) from a given
     * handler group.
     *
     * @param handler  Update handler to remove, its type or `'all'` to remove all
     * @param group  (default: `0`) Handler group index
     */
    removeUpdateHandler(
        handler: UpdateHandler | UpdateHandler['type'] | 'all',
        group?: number
    ): void {
        return removeUpdateHandler.apply(this, arguments)
    }
    protected _handleUpdate(update: tl.TypeUpdates): void {
        return _handleUpdate.apply(this, arguments)
    }
    /**
     * Register a message handler without any filters.
     *
     * @param handler  Message handler
     */
    onNewMessage(
        handler: (msg: Message) => MaybeAsync<void | PropagationSymbol>
    ): void
    /**
     * Register a message handler with a given filter
     *
     * @param filter  Update filter
     * @param handler  Message handler
     */
    onNewMessage<Mod>(
        filter: UpdateFilter<Message, Mod>,
        handler: (
            msg: filters.Modify<Message, Mod>
        ) => MaybeAsync<void | PropagationSymbol>
    ): void

    onNewMessage<Mod>(
        filter:
            | UpdateFilter<Message, Mod>
            | ((msg: Message) => MaybeAsync<void | PropagationSymbol>),
        handler?: (
            msg: filters.Modify<Message, Mod>
        ) => MaybeAsync<void | PropagationSymbol>
    ): void {
        return onNewMessage.apply(this, arguments)
    }
    /**
     * Block a user
     *
     * @param id  User ID, its username or phone number
     * @returns  Whether the action was successful
     */
    blockUser(id: InputPeerLike): Promise<boolean> {
        return blockUser.apply(this, arguments)
    }
    /**
     * Get a list of common chats you have with a given user
     *
     * @param userId  User's ID, username or phone number
     * @throws MtCuteInvalidPeerTypeError
     */
    getCommonChats(userId: InputPeerLike): Promise<Chat[]> {
        return getCommonChats.apply(this, arguments)
    }
    /**
     * Get currently authorized user's full information
     *
     */
    getMe(): Promise<User> {
        return getMe.apply(this, arguments)
    }
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

    getUsers(ids: MaybeArray<InputPeerLike>): Promise<MaybeArray<User>> {
        return getUsers.apply(this, arguments)
    }
    /**
     * Get the `InputPeer` of a known peer id.
     * Useful when an `InputPeer` is needed.
     *
     * @param peerId  The peer identifier that you want to extract the `InputPeer` from.
     */
    resolvePeer(
        peerId: InputPeerLike
    ): Promise<tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel> {
        return resolvePeer.apply(this, arguments)
    }
}
