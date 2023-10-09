/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/unified-signatures */
/* THIS FILE WAS AUTO-GENERATED */
import { Readable } from 'stream'

import {
    BaseTelegramClient,
    BaseTelegramClientOptions,
    Long,
    MaybeArray,
    MaybeAsync,
    PartialExcept,
    PartialOnly,
    tl,
} from '@mtcute/core'
import { tdFileId } from '@mtcute/file-id'

import { _onAuthorization, AuthState, getAuthState } from './methods/auth/_state'
import { checkPassword } from './methods/auth/check-password'
import { getPasswordHint } from './methods/auth/get-password-hint'
import { logOut } from './methods/auth/log-out'
import { recoverPassword } from './methods/auth/recover-password'
import { resendCode } from './methods/auth/resend-code'
import { run } from './methods/auth/run'
import { sendCode } from './methods/auth/send-code'
import { sendRecoveryCode } from './methods/auth/send-recovery-code'
import { signIn } from './methods/auth/sign-in'
import { signInBot } from './methods/auth/sign-in-bot'
import { start } from './methods/auth/start'
import { startTest } from './methods/auth/start-test'
import { answerCallbackQuery } from './methods/bots/answer-callback-query'
import { answerInlineQuery } from './methods/bots/answer-inline-query'
import { answerPreCheckoutQuery } from './methods/bots/answer-pre-checkout-query'
import { deleteMyCommands } from './methods/bots/delete-my-commands'
import { getBotInfo } from './methods/bots/get-bot-info'
import { getBotMenuButton } from './methods/bots/get-bot-menu-button'
import { getCallbackAnswer } from './methods/bots/get-callback-answer'
import { getGameHighScores, getInlineGameHighScores } from './methods/bots/get-game-high-scores'
import { getMyCommands } from './methods/bots/get-my-commands'
import { _normalizeCommandScope } from './methods/bots/normalize-command-scope'
import { setBotInfo } from './methods/bots/set-bot-info'
import { setBotMenuButton } from './methods/bots/set-bot-menu-button'
import { setGameScore, setInlineGameScore } from './methods/bots/set-game-score'
import { setMyCommands } from './methods/bots/set-my-commands'
import { setMyDefaultRights } from './methods/bots/set-my-default-rights'
import { addChatMembers } from './methods/chats/add-chat-members'
import { archiveChats } from './methods/chats/archive-chats'
import { banChatMember } from './methods/chats/ban-chat-member'
import { createChannel } from './methods/chats/create-channel'
import { createGroup } from './methods/chats/create-group'
import { createSupergroup } from './methods/chats/create-supergroup'
import { deleteChannel } from './methods/chats/delete-channel'
import { deleteChatPhoto } from './methods/chats/delete-chat-photo'
import { deleteGroup } from './methods/chats/delete-group'
import { deleteHistory } from './methods/chats/delete-history'
import { deleteUserHistory } from './methods/chats/delete-user-history'
import { editAdminRights } from './methods/chats/edit-admin-rights'
import { getChat } from './methods/chats/get-chat'
import { getChatEventLog } from './methods/chats/get-chat-event-log'
import { getChatMember } from './methods/chats/get-chat-member'
import { getChatMembers } from './methods/chats/get-chat-members'
import { getChatPreview } from './methods/chats/get-chat-preview'
import { getFullChat } from './methods/chats/get-full-chat'
import { getNearbyChats } from './methods/chats/get-nearby-chats'
import { iterChatEventLog } from './methods/chats/iter-chat-event-log'
import { iterChatMembers } from './methods/chats/iter-chat-members'
import { joinChat } from './methods/chats/join-chat'
import { kickChatMember } from './methods/chats/kick-chat-member'
import { leaveChat } from './methods/chats/leave-chat'
import { markChatUnread } from './methods/chats/mark-chat-unread'
import { reorderUsernames } from './methods/chats/reorder-usernames'
import { restrictChatMember } from './methods/chats/restrict-chat-member'
import { saveDraft } from './methods/chats/save-draft'
import { setChatDefaultPermissions } from './methods/chats/set-chat-default-permissions'
import { setChatDescription } from './methods/chats/set-chat-description'
import { setChatPhoto } from './methods/chats/set-chat-photo'
import { setChatTitle } from './methods/chats/set-chat-title'
import { setChatTtl } from './methods/chats/set-chat-ttl'
import { setChatUsername } from './methods/chats/set-chat-username'
import { setSlowMode } from './methods/chats/set-slow-mode'
import { toggleContentProtection } from './methods/chats/toggle-content-protection'
import { toggleFragmentUsername } from './methods/chats/toggle-fragment-username'
import { toggleJoinRequests } from './methods/chats/toggle-join-requests'
import { toggleJoinToSend } from './methods/chats/toggle-join-to-send'
import { unarchiveChats } from './methods/chats/unarchive-chats'
import { unbanChatMember } from './methods/chats/unban-chat-member'
import { addContact } from './methods/contacts/add-contact'
import { deleteContacts } from './methods/contacts/delete-contacts'
import { getContacts } from './methods/contacts/get-contacts'
import { importContacts } from './methods/contacts/import-contacts'
import { createFolder } from './methods/dialogs/create-folder'
import { deleteFolder } from './methods/dialogs/delete-folder'
import { editFolder } from './methods/dialogs/edit-folder'
import { findFolder } from './methods/dialogs/find-folder'
import { _normalizeInputFolder, getFolders } from './methods/dialogs/get-folders'
import { getPeerDialogs } from './methods/dialogs/get-peer-dialogs'
import { iterDialogs } from './methods/dialogs/iter-dialogs'
import { setFoldersOrder } from './methods/dialogs/set-folders-order'
import { downloadAsBuffer } from './methods/files/download-buffer'
import { downloadToFile } from './methods/files/download-file'
import { downloadAsIterable } from './methods/files/download-iterable'
import { downloadAsStream } from './methods/files/download-stream'
import { _normalizeFileToDocument } from './methods/files/normalize-file-to-document'
import { _normalizeInputFile } from './methods/files/normalize-input-file'
import { _normalizeInputMedia } from './methods/files/normalize-input-media'
import { uploadFile } from './methods/files/upload-file'
import { uploadMedia } from './methods/files/upload-media'
import { createForumTopic } from './methods/forums/create-forum-topic'
import { deleteForumTopicHistory } from './methods/forums/delete-forum-topic-history'
import { editForumTopic } from './methods/forums/edit-forum-topic'
import { getForumTopics, GetForumTopicsOffset } from './methods/forums/get-forum-topics'
import { getForumTopicsById } from './methods/forums/get-forum-topics-by-id'
import { iterForumTopics } from './methods/forums/iter-forum-topics'
import { reorderPinnedForumTopics } from './methods/forums/reorder-pinned-forum-topics'
import { toggleForum } from './methods/forums/toggle-forum'
import { toggleForumTopicClosed } from './methods/forums/toggle-forum-topic-closed'
import { toggleForumTopicPinned } from './methods/forums/toggle-forum-topic-pinned'
import { toggleGeneralTopicHidden } from './methods/forums/toggle-general-topic-hidden'
import { createInviteLink } from './methods/invite-links/create-invite-link'
import { editInviteLink } from './methods/invite-links/edit-invite-link'
import { exportInviteLink } from './methods/invite-links/export-invite-link'
import { getInviteLink } from './methods/invite-links/get-invite-link'
import { getInviteLinkMembers } from './methods/invite-links/get-invite-link-members'
import { getInviteLinks, GetInviteLinksOffset } from './methods/invite-links/get-invite-links'
import { getPrimaryInviteLink } from './methods/invite-links/get-primary-invite-link'
import { hideAllJoinRequests } from './methods/invite-links/hide-all-join-requests'
import { hideJoinRequest } from './methods/invite-links/hide-join-request'
import { iterInviteLinkMembers } from './methods/invite-links/iter-invite-link-members'
import { iterInviteLinks } from './methods/invite-links/iter-invite-links'
import { revokeInviteLink } from './methods/invite-links/revoke-invite-link'
import { closePoll } from './methods/messages/close-poll'
import { deleteMessages } from './methods/messages/delete-messages'
import { deleteScheduledMessages } from './methods/messages/delete-scheduled-messages'
import { editInlineMessage } from './methods/messages/edit-inline-message'
import { editMessage } from './methods/messages/edit-message'
import { _findMessageInUpdate } from './methods/messages/find-in-update'
import { forwardMessages } from './methods/messages/forward-messages'
import { _getDiscussionMessage, getDiscussionMessage } from './methods/messages/get-discussion-message'
import { getHistory, GetHistoryOffset } from './methods/messages/get-history'
import { getMessageGroup } from './methods/messages/get-message-group'
import { getMessageReactions } from './methods/messages/get-message-reactions'
import { getMessages } from './methods/messages/get-messages'
import { getMessagesUnsafe } from './methods/messages/get-messages-unsafe'
import { getReactionUsers, GetReactionUsersOffset } from './methods/messages/get-reaction-users'
import { getScheduledMessages } from './methods/messages/get-scheduled-messages'
import { iterHistory } from './methods/messages/iter-history'
import { iterReactionUsers } from './methods/messages/iter-reaction-users'
import { iterSearchGlobal } from './methods/messages/iter-search-global'
import { iterSearchMessages } from './methods/messages/iter-search-messages'
import { _parseEntities } from './methods/messages/parse-entities'
import { pinMessage } from './methods/messages/pin-message'
import { readHistory } from './methods/messages/read-history'
import { readReactions } from './methods/messages/read-reactions'
import { searchGlobal, SearchGlobalOffset } from './methods/messages/search-global'
import { searchMessages, SearchMessagesOffset } from './methods/messages/search-messages'
import { sendCopy } from './methods/messages/send-copy'
import { sendMedia } from './methods/messages/send-media'
import { sendMediaGroup } from './methods/messages/send-media-group'
import { sendReaction } from './methods/messages/send-reaction'
import { sendScheduled } from './methods/messages/send-scheduled'
import { sendText } from './methods/messages/send-text'
import { sendTyping } from './methods/messages/send-typing'
import { sendVote } from './methods/messages/send-vote'
import { translateMessage } from './methods/messages/translate-message'
import { translateText } from './methods/messages/translate-text'
import { unpinAllMessages } from './methods/messages/unpin-all-messages'
import { unpinMessage } from './methods/messages/unpin-message'
import { initTakeoutSession } from './methods/misc/init-takeout-session'
import { _normalizePrivacyRules } from './methods/misc/normalize-privacy-rules'
import { getParseModesState, ParseModesState } from './methods/parse-modes/_state'
import {
    getParseMode,
    registerParseMode,
    setDefaultParseMode,
    unregisterParseMode,
} from './methods/parse-modes/parse-modes'
import { changeCloudPassword } from './methods/password/change-cloud-password'
import { enableCloudPassword } from './methods/password/enable-cloud-password'
import { cancelPasswordEmail, resendPasswordEmail, verifyPasswordEmail } from './methods/password/password-email'
import { removeCloudPassword } from './methods/password/remove-cloud-password'
import { addStickerToSet } from './methods/stickers/add-sticker-to-set'
import { createStickerSet } from './methods/stickers/create-sticker-set'
import { deleteStickerFromSet } from './methods/stickers/delete-sticker-from-set'
import { getCustomEmojis } from './methods/stickers/get-custom-emojis'
import { getInstalledStickers } from './methods/stickers/get-installed-stickers'
import { getStickerSet } from './methods/stickers/get-sticker-set'
import { moveStickerInSet } from './methods/stickers/move-sticker-in-set'
import { setChatStickerSet } from './methods/stickers/set-chat-sticker-set'
import { setStickerSetThumb } from './methods/stickers/set-sticker-set-thumb'
import { applyBoost } from './methods/stories/apply-boost'
import { canApplyBoost, CanApplyBoostResult } from './methods/stories/can-apply-boost'
import { canSendStory, CanSendStoryResult } from './methods/stories/can-send-story'
import { deleteStories } from './methods/stories/delete-stories'
import { editStory } from './methods/stories/edit-story'
import { _findStoryInUpdate } from './methods/stories/find-in-update'
import { getAllStories } from './methods/stories/get-all-stories'
import { getBoostStats } from './methods/stories/get-boost-stats'
import { getBoosters } from './methods/stories/get-boosters'
import { getPeerStories } from './methods/stories/get-peer-stories'
import { getProfileStories } from './methods/stories/get-profile-stories'
import { getStoriesById } from './methods/stories/get-stories-by-id'
import { getStoriesInteractions } from './methods/stories/get-stories-interactions'
import { getStoryLink } from './methods/stories/get-story-link'
import { getStoryViewers } from './methods/stories/get-story-viewers'
import { hideMyStoriesViews } from './methods/stories/hide-my-stories-views'
import { incrementStoriesViews } from './methods/stories/increment-stories-views'
import { iterAllStories } from './methods/stories/iter-all-stories'
import { iterBoosters } from './methods/stories/iter-boosters'
import { iterProfileStories } from './methods/stories/iter-profile-stories'
import { iterStoryViewers } from './methods/stories/iter-story-viewers'
import { readStories } from './methods/stories/read-stories'
import { reportStory } from './methods/stories/report-story'
import { sendStory } from './methods/stories/send-story'
import { sendStoryReaction } from './methods/stories/send-story-reaction'
import { togglePeerStoriesArchived } from './methods/stories/toggle-peer-stories-archived'
import { toggleStoriesPinned } from './methods/stories/toggle-stories-pinned'
import { enableUpdatesProcessing, makeParsedUpdateHandler, ParsedUpdateHandlerParams } from './methods/updates'
import {
    catchUp,
    enableRps,
    getCurrentRpsIncoming,
    getCurrentRpsProcessing,
    startUpdatesLoop,
    stopUpdatesLoop,
} from './methods/updates/manager'
import { blockUser } from './methods/users/block-user'
import { deleteProfilePhotos } from './methods/users/delete-profile-photos'
import { editCloseFriends, editCloseFriendsRaw } from './methods/users/edit-close-friends'
import { getCommonChats } from './methods/users/get-common-chats'
import { getGlobalTtl } from './methods/users/get-global-ttl'
import { getMe } from './methods/users/get-me'
import { getMyUsername } from './methods/users/get-my-username'
import { getProfilePhoto } from './methods/users/get-profile-photo'
import { getProfilePhotos } from './methods/users/get-profile-photos'
import { getUsers } from './methods/users/get-users'
import { iterProfilePhotos } from './methods/users/iter-profile-photos'
import { resolvePeer } from './methods/users/resolve-peer'
import { resolvePeerMany } from './methods/users/resolve-peer-many'
import { setEmojiStatus } from './methods/users/set-emoji-status'
import { setGlobalTtl } from './methods/users/set-global-ttl'
import { setOffline } from './methods/users/set-offline'
import { setProfilePhoto } from './methods/users/set-profile-photo'
import { setUsername } from './methods/users/set-username'
import { unblockUser } from './methods/users/unblock-user'
import { updateProfile } from './methods/users/update-profile'
import {
    AllStories,
    ArrayPaginated,
    ArrayWithTotal,
    Booster,
    BoostStats,
    BotChatJoinRequestUpdate,
    BotCommands,
    BotStoppedUpdate,
    CallbackQuery,
    Chat,
    ChatEvent,
    ChatInviteLink,
    ChatInviteLinkMember,
    ChatJoinRequestUpdate,
    ChatMember,
    ChatMemberUpdate,
    ChatPreview,
    ChosenInlineResult,
    DeleteMessageUpdate,
    DeleteStoryUpdate,
    Dialog,
    FileDownloadParameters,
    FormattedString,
    ForumTopic,
    GameHighScore,
    HistoryReadUpdate,
    IMessageEntityParser,
    InlineQuery,
    InputChatEventFilters,
    InputDialogFolder,
    InputFileLike,
    InputInlineResult,
    InputMediaLike,
    InputPeerLike,
    InputPrivacyRule,
    InputReaction,
    InputStickerSet,
    InputStickerSetItem,
    MaybeDynamic,
    Message,
    MessageEntity,
    MessageMedia,
    MessageReactions,
    ParsedUpdate,
    PeerReaction,
    PeersIndex,
    PeerStories,
    Photo,
    Poll,
    PollUpdate,
    PollVoteUpdate,
    PreCheckoutQuery,
    RawDocument,
    ReplyMarkup,
    SentCode,
    Sticker,
    StickerSet,
    StickerSourceType,
    StickerType,
    StoriesStealthMode,
    Story,
    StoryInteractions,
    StoryUpdate,
    StoryViewer,
    StoryViewersList,
    TakeoutSession,
    TypingStatus,
    UploadedFile,
    UploadFileLike,
    User,
    UserStatusUpdate,
    UserTypingUpdate,
} from './types'
import { Conversation } from './types/conversation'

// from methods/_init.ts
interface TelegramClientOptions extends BaseTelegramClientOptions {
    /**
     * Parameters for updates manager.
     */
    updates?: Omit<ParsedUpdateHandlerParams, 'onUpdate' | 'onRawUpdate'>
}

export interface TelegramClient extends BaseTelegramClient {
    /**
     * Register a raw update handler
     *
     * @param name  Event name
     * @param handler  Raw update handler
     */
    on(name: 'raw_update', handler: (upd: tl.TypeUpdate | tl.TypeMessage, peers: PeersIndex) => void): this
    /**
     * Register a parsed update handler
     *
     * @param name  Event name
     * @param handler  Raw update handler
     */
    on(name: 'update', handler: (upd: ParsedUpdate) => void): this
    /**
     * Register a new message handler
     *
     * @param name  Event name
     * @param handler  New message handler
     */
    on(name: 'new_message', handler: (upd: Message) => void): this
    /**
     * Register an edit message handler
     *
     * @param name  Event name
     * @param handler  Edit message handler
     */
    on(name: 'edit_message', handler: (upd: Message) => void): this
    /**
     * Register a message group handler
     *
     * @param name  Event name
     * @param handler  Message group handler
     */
    on(name: 'message_group', handler: (upd: Message[]) => void): this
    /**
     * Register a delete message handler
     *
     * @param name  Event name
     * @param handler  Delete message handler
     */
    on(name: 'delete_message', handler: (upd: DeleteMessageUpdate) => void): this
    /**
     * Register a chat member update handler
     *
     * @param name  Event name
     * @param handler  Chat member update handler
     */
    on(name: 'chat_member', handler: (upd: ChatMemberUpdate) => void): this
    /**
     * Register an inline query handler
     *
     * @param name  Event name
     * @param handler  Inline query handler
     */
    on(name: 'inline_query', handler: (upd: InlineQuery) => void): this
    /**
     * Register a chosen inline result handler
     *
     * @param name  Event name
     * @param handler  Chosen inline result handler
     */
    on(name: 'chosen_inline_result', handler: (upd: ChosenInlineResult) => void): this
    /**
     * Register a callback query handler
     *
     * @param name  Event name
     * @param handler  Callback query handler
     */
    on(name: 'callback_query', handler: (upd: CallbackQuery) => void): this
    /**
     * Register a poll update handler
     *
     * @param name  Event name
     * @param handler  Poll update handler
     */
    on(name: 'poll', handler: (upd: PollUpdate) => void): this
    /**
     * Register a poll vote handler
     *
     * @param name  Event name
     * @param handler  Poll vote handler
     */
    on(name: 'poll_vote', handler: (upd: PollVoteUpdate) => void): this
    /**
     * Register an user status update handler
     *
     * @param name  Event name
     * @param handler  User status update handler
     */
    on(name: 'user_status', handler: (upd: UserStatusUpdate) => void): this
    /**
     * Register an user typing handler
     *
     * @param name  Event name
     * @param handler  User typing handler
     */
    on(name: 'user_typing', handler: (upd: UserTypingUpdate) => void): this
    /**
     * Register a history read handler
     *
     * @param name  Event name
     * @param handler  History read handler
     */
    on(name: 'history_read', handler: (upd: HistoryReadUpdate) => void): this
    /**
     * Register a bot stopped handler
     *
     * @param name  Event name
     * @param handler  Bot stopped handler
     */
    on(name: 'bot_stopped', handler: (upd: BotStoppedUpdate) => void): this
    /**
     * Register a bot chat join request handler
     *
     * @param name  Event name
     * @param handler  Bot chat join request handler
     */
    on(name: 'bot_chat_join_request', handler: (upd: BotChatJoinRequestUpdate) => void): this
    /**
     * Register a chat join request handler
     *
     * @param name  Event name
     * @param handler  Chat join request handler
     */
    on(name: 'chat_join_request', handler: (upd: ChatJoinRequestUpdate) => void): this
    /**
     * Register a pre checkout query handler
     *
     * @param name  Event name
     * @param handler  Pre checkout query handler
     */
    on(name: 'pre_checkout_query', handler: (upd: PreCheckoutQuery) => void): this
    /**
     * Register a story update handler
     *
     * @param name  Event name
     * @param handler  Story update handler
     */
    on(name: 'story', handler: (upd: StoryUpdate) => void): this
    /**
     * Register a delete story handler
     *
     * @param name  Event name
     * @param handler  Delete story handler
     */
    on(name: 'delete_story', handler: (upd: DeleteStoryUpdate) => void): this

    getAuthState(): AuthState

    _onAuthorization(auth: tl.auth.TypeAuthorization, bot?: boolean): User
    /**
     * Check your Two-Step verification password and log in
     *
     * **Available**: 👤 users only
     *
     * @param password  Your Two-Step verification password
     * @returns  The authorized user
     * @throws BadRequestError  In case the password is invalid
     */
    checkPassword(password: string): Promise<User>
    /**
     * Get your Two-Step Verification password hint.
     *
     * **Available**: 👤 users only
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
     * **Available**: ✅ both users and bots
     *
     * @returns  On success, `true` is returned
     */
    logOut(): Promise<true>
    /**
     * Recover your password with a recovery code and log in.
     *
     * **Available**: 👤 users only
     *
     * @returns  The authorized user
     * @throws BadRequestError  In case the code is invalid
     */
    recoverPassword(params: {
        /** The recovery code sent via email */
        recoveryCode: string
    }): Promise<User>
    /**
     * Re-send the confirmation code using a different type.
     *
     * The type of the code to be re-sent is specified in the `nextType` attribute of
     * {@link SentCode} object returned by {@link sendCode}
     * **Available**: 👤 users only
     *
     */
    resendCode(params: {
        /** Phone number in international format */
        phone: string

        /** Confirmation code identifier from {@link SentCode} */
        phoneCodeHash: string
    }): Promise<SentCode>
    /**
     * Simple wrapper that calls {@link start} and then
     * provided callback function (if any) without the
     * need to introduce a `main()` function manually.
     *
     * Errors that were encountered while calling {@link start}
     * and `then` will be emitted as usual, and can be caught with {@link onError}
     *
     * **Available**: ✅ both users and bots
     *
     * @param params  Parameters to be passed to {@link start}
     * @param then  Function to be called after {@link start} returns
     */
    run(params: Parameters<typeof start>[1], then?: (user: User) => void | Promise<void>): void
    /**
     * Send the confirmation code to the given phone number
     *
     * **Available**: 👤 users only
     *
     * @returns  An object containing information about the sent confirmation code
     */
    sendCode(params: {
        /** Phone number in international format */
        phone: string
    }): Promise<SentCode>
    /**
     * Send a code to email needed to recover your password
     *
     * **Available**: 👤 users only
     *
     * @returns  String containing email pattern to which the recovery code was sent
     */
    sendRecoveryCode(): Promise<string>
    /**
     * Authorize a bot using its token issued by [@BotFather](//t.me/BotFather)
     *
     * **Available**: ✅ both users and bots
     *
     * @param token  Bot token issued by BotFather
     * @returns  Bot's {@link User} object
     * @throws BadRequestError  In case the bot token is invalid
     */
    signInBot(token: string): Promise<User>
    /**
     * Authorize a user in Telegram with a valid confirmation code.
     *
     * **Available**: 👤 users only
     *
     * @returns  If the code was valid and authorization succeeded, the {@link User} is returned.
     * @throws  BadRequestError  In case the arguments are invalid
     * @throws  SessionPasswordNeededError  In case a password is needed to sign in
     */
    signIn(params: {
        /** Phone number in international format */
        phone: string
        /** Code identifier from {@link sendCode} */
        phoneCodeHash: string
        /** The confirmation code that was received */
        phoneCode: string
    }): Promise<User>
    /**
     * Utility function to quickly authorize on test DC
     * using a [Test phone number](https://core.telegram.org/api/auth#test-phone-numbers),
     * which is randomly generated by default.
     *
     * > **Note**: Using this method assumes that you
     * > are using a test DC in `primaryDc` parameter.
     *
     * **Available**: ✅ both users and bots
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
     * **Available**: ✅ both users and bots
     *
     */
    start(params: {
        /**
         * String session exported using {@link TelegramClient.exportSession}.
         *
         * This simply calls {@link TelegramClient.importSession} before anything else.
         *
         * Note that passed session will be ignored in case storage already
         * contains authorization.
         */
        session?: string

        /**
         * Whether to overwrite existing session.
         */
        sessionForce?: boolean

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
         * Custom method that is called when a code is sent. Can be used
         * to show a GUI alert of some kind.
         * Defaults to `console.log`.
         *
         * This method is called *before* {@link start.params.code}.
         *
         * @param code
         */
        codeSentCallback?: (code: SentCode) => MaybeAsync<void>
    }): Promise<User>
    /**
     * Send an answer to a callback query.
     *
     * **Available**: 🤖 bots only
     *
     * @param queryId  ID of the callback query
     * @param params  Parameters of the answer
     */
    answerCallbackQuery(
        queryId: Long,
        params?: {
            /**
             * Maximum amount of time in seconds for which
             * this result can be cached by the client (not server!).
             *
             * @default  0
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
             * @default  false
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
        },
    ): Promise<void>
    /**
     * Answer an inline query.
     *
     * **Available**: 🤖 bots only
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
             * @default  300
             */
            cacheTime?: number

            /**
             * Whether the results should be displayed as a gallery instead
             * of a vertical list. Only applicable to some media types.
             *
             * In some cases changing this may lead to the results not being
             * displayed by the client.
             *
             * Default is derived automatically based on result types
             */
            gallery?: boolean

            /**
             * Whether the results should only be cached on the server
             * for the user who sent the query.
             *
             * @default  false
             */
            private?: boolean

            /**
             * Next pagination offset (up to 64 bytes).
             *
             * When user has reached the end of the current results,
             * the client will re-send the inline query with the same text, but
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
        },
    ): Promise<void>
    /**
     * Answer a pre-checkout query.
     *
     * **Available**: ✅ both users and bots
     *
     * @param queryId  Pre-checkout query ID
     */
    answerPreCheckoutQuery(
        queryId: tl.Long,
        params?: {
            /** If pre-checkout is rejected, error message to show to the user */
            error?: string
        },
    ): Promise<void>
    /**
     * Delete commands for the current bot and the given scope.
     *
     * Does the same as passing `null` to  {@link setMyCommands}
     *
     * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
     * **Available**: ✅ both users and bots
     *
     */
    deleteMyCommands(params?: {
        /**
         * Scope of the commands.
         *
         * Defaults to `BotScope.default_` (i.e. `botCommandScopeDefault`)
         */
        scope?: tl.TypeBotCommandScope | BotCommands.IntermediateScope

        /**
         * User language applied to the scope.
         */
        langCode?: string
    }): Promise<void>
    /**
     * Gets information about a bot the current uzer owns (or the current bot)
     * **Available**: ✅ both users and bots
     *
     */
    getBotInfo(params: {
        /**
         * When called by a user, a bot the user owns must be specified.
         * When called by a bot, must be empty
         */
        bot?: InputPeerLike

        /**
         * If passed, will retrieve the bot's description in the given language.
         * If left empty, will retrieve the fallback description.
         */
        langCode?: string
    }): Promise<tl.bots.RawBotInfo>
    /**
     * Fetches the menu button set for the given user.
     * **Available**: 🤖 bots only
     *
     */
    getBotMenuButton(user: InputPeerLike): Promise<tl.TypeBotMenuButton>
    /**
     * Request a callback answer from a bot,
     * i.e. click an inline button that contains data.
     *
     * **Available**: 👤 users only
     *
     * @param params
     */
    getCallbackAnswer(params: {
        /** Chat ID where the message was found */
        chatId: InputPeerLike

        /** ID of the message containing the button */
        message: number

        /** Data contained in the button */
        data: string | Buffer

        /**
         * Timeout for the query in ms.
         *
         * Defaults to `10000` (10 sec)
         */
        timeout?: number

        /**
         * Whether this is a "play game" button
         */
        game?: boolean

        /**
         * If the button requires password entry, your 2FA password.
         *
         * Your password is never exposed to the bot,
         * it is checked by Telegram.
         */
        password?: string
    }): Promise<tl.messages.TypeBotCallbackAnswer>
    /**
     * Get high scores of a game
     * **Available**: 🤖 bots only
     *
     */
    getGameHighScores(params: {
        /** ID of the chat where the game was found */
        chatId: InputPeerLike

        /** ID of the message containing the game */
        message: number

        /** ID of the user to find high scores for */
        userId?: InputPeerLike
    }): Promise<GameHighScore[]>
    /**
     * Get high scores of a game from an inline message
     *
     * **Available**: 🤖 bots only
     *
     * @param messageId  ID of the inline message containing the game
     * @param userId  ID of the user to find high scores for
     */
    getInlineGameHighScores(
        messageId: string | tl.TypeInputBotInlineMessageID,
        userId?: InputPeerLike,
    ): Promise<GameHighScore[]>
    /**
     * Get a list of current bot's commands for the given command scope
     * and user language. If they are not set, empty set is returned.
     *
     * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
     * **Available**: ✅ both users and bots
     *
     */
    getMyCommands(params?: {
        /**
         * Scope of the commands.
         *
         * Defaults to `BotScope.default_` (i.e. `botCommandScopeDefault`)
         */
        scope?: tl.TypeBotCommandScope | BotCommands.IntermediateScope

        /**
         * User language applied to the scope.
         */
        langCode?: string
    }): Promise<tl.RawBotCommand[]>

    _normalizeCommandScope(
        scope: tl.TypeBotCommandScope | BotCommands.IntermediateScope,
    ): Promise<tl.TypeBotCommandScope>
    /**
     * Sets information about a bot the current uzer owns (or the current bot)
     * **Available**: ✅ both users and bots
     *
     */
    setBotInfo(params: {
        /**
         * When called by a user, a bot the user owns must be specified.
         * When called by a bot, must be empty
         */
        bot?: InputPeerLike

        /**
         * If passed, will update the bot's description in the given language.
         * If left empty, will change the fallback description.
         */
        langCode?: string

        /** New bot name */
        name?: string

        /** New bio text (displayed in the profile) */
        bio?: string

        /** New description text (displayed when the chat is empty) */
        description?: string
    }): Promise<void>
    /**
     * Sets a menu button for the given user.
     * **Available**: ✅ both users and bots
     *
     */
    setBotMenuButton(user: InputPeerLike, button: tl.TypeBotMenuButton): Promise<void>
    /**
     * Set a score of a user in a game
     *
     * **Available**: 🤖 bots only
     *
     * @param params
     * @returns  The modified message
     */
    setGameScore(params: {
        /** Chat where the game was found */
        chatId: InputPeerLike

        /** ID of the message where the game was found */
        message: number

        /** ID of the user who has scored */
        userId: InputPeerLike

        /** The new score (must be >0) */
        score: number

        /**
         * When `true`, the game message will not be modified
         * to include the new score
         */
        noEdit?: boolean

        /**
         * Whether to allow user's score to decrease.
         * This can be useful when fixing mistakes or banning cheaters
         */
        force?: boolean
    }): Promise<Message>
    /**
     * Set a score of a user in a game contained in
     * an inline message
     *
     * **Available**: 🤖 bots only
     *
     * @param params
     */
    setInlineGameScore(params: {
        /** ID of the inline message */
        messageId: string | tl.TypeInputBotInlineMessageID
        /** ID of the user who has scored */
        userId: InputPeerLike
        /** The new score (must be >0) */
        score: number
        /**
         * When `true`, the game message will not be modified
         * to include the new score
         */
        noEdit?: boolean

        /**
         * Whether to allow user's score to decrease.
         * This can be useful when fixing mistakes or banning cheaters
         */
        force?: boolean
    }): Promise<void>
    /**
     * Set or delete commands for the current bot and the given scope
     *
     * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
     * **Available**: 🤖 bots only
     *
     */
    setMyCommands(params: {
        /**
         * New list of bot commands for the given scope.
         *
         * Pass empty array or `null` to delete them.
         */
        commands: tl.RawBotCommand[] | null

        /**
         * Scope of the commands.
         *
         * Defaults to `BotScope.default_` (i.e. `botCommandScopeDefault`)
         */
        scope?: tl.TypeBotCommandScope | BotCommands.IntermediateScope

        /**
         * User language applied to the scope.
         */
        langCode?: string
    }): Promise<void>
    /**
     * Sets the default chat permissions for the bot in the supergroup or channel.
     * **Available**: 🤖 bots only
     *
     */
    setMyDefaultRights(params: {
        /** Whether to target groups or channels. */
        target: 'channel' | 'group'
        /** The default chat permissions. */
        rights: Omit<tl.RawChatAdminRights, '_'>
    }): Promise<void>
    /**
     * Add one or more new members to a group, supergroup or channel.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  ID of the chat or its username
     * @param users ID(s) of the user(s) to add
     */
    addChatMembers(
        chatId: InputPeerLike,
        users: MaybeArray<InputPeerLike>,
        params: {
            /**
             * Number of old messages to be forwarded (0-100).
             * Only applicable to legacy groups, ignored for supergroups and channels
             *
             * @default 100
             */
            forwardCount?: number
        },
    ): Promise<void>
    /**
     * Archive one or more chats
     *
     * **Available**: 👤 users only
     *
     * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
     */
    archiveChats(chats: MaybeArray<InputPeerLike>): Promise<void>
    /**
     * Ban a user/channel from a legacy group, a supergroup or a channel.
     * They will not be able to re-join the group on their own,
     * manual administrator's action will be required.
     *
     * When banning a channel, the user won't be able to use
     * any of their channels to post until the ban is lifted.
     *
     * **Available**: ✅ both users and bots
     *
     * @returns  Service message about removed user, if one was generated.
     */
    banChatMember(params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** ID of the user/channel to ban */
        participantId: InputPeerLike
    }): Promise<Message | null>
    /**
     * Create a new broadcast channel
     *
     * **Available**: 👤 users only
     *
     * @returns  Newly created channel
     */
    createChannel(params: {
        /**
         * Channel title
         */
        title: string

        /**
         * Channel description
         */
        description?: string
    }): Promise<Chat>
    /**
     * Create a legacy group chat
     *
     * If you want to create a supergroup, use {@link createSupergroup}
     * instead.
     * **Available**: 👤 users only
     *
     */
    createGroup(params: {
        /**
         * Group title
         */
        title: string

        /**
         * User(s) to be invited in the group (ID(s), username(s) or phone number(s)).
         * Due to Telegram limitations, you can't create a legacy group with just yourself.
         */
        users: MaybeArray<InputPeerLike>

        /**
         * TTL period (in seconds) for the newly created chat
         *
         * @default 0 (i.e. messages don't expire)
         */
        ttlPeriod?: number
    }): Promise<Chat>
    /**
     * Create a new supergroup
     *
     * **Available**: 👤 users only
     *
     * @returns  Newly created supergroup
     */
    createSupergroup(params: {
        /**
         * Supergroup title
         */
        title: string

        /**
         * Supergroup description
         */
        description?: string

        /**
         * Whether to create a forum
         */
        forum?: boolean

        /**
         * TTL period (in seconds) for the newly created supergroup
         *
         * @default 0 (i.e. messages don't expire)
         */
        ttlPeriod?: number
    }): Promise<Chat>

    /**
     * Delete a channel or a supergroup
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID or username
     */
    deleteChannel(chatId: InputPeerLike): Promise<void>

    /**
     * Delete a channel or a supergroup
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID or username
     */
    deleteSupergroup(chatId: InputPeerLike): Promise<void>
    /**
     * Delete a chat photo
     *
     * You must be an administrator and have the appropriate permissions.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     */
    deleteChatPhoto(chatId: InputPeerLike): Promise<void>
    /**
     * Delete a legacy group chat for all members
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     */
    deleteGroup(chatId: InputPeerLike): Promise<void>
    /**
     * Delete communication history (for private chats and legacy groups)
     * **Available**: 👤 users only
     *
     */
    deleteHistory(
        chat: InputPeerLike,
        params?: {
            /**
             * Deletion mode. Can be:
             * - `delete`: delete messages (only for yourself)
             * - `clear`: delete messages (only for yourself)
             * - `revoke`: delete messages for all users
             * - I'm not sure what's the difference between `delete` and `clear`,
             * but they are in fact different flags in TL object.
             *
             * @default  'delete'
             */
            mode: 'delete' | 'clear' | 'revoke'

            /**
             * Maximum ID of message to delete.
             *
             * @default  0, i.e. remove all messages
             */
            maxId?: number
        },
    ): Promise<void>
    /**
     * Delete all messages of a user (or channel) in a supergroup
     * **Available**: 👤 users only
     *
     */
    deleteUserHistory(params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** User/channel ID whose messages to delete */
        participantId: InputPeerLike
    }): Promise<void>
    /**
     * Edit supergroup/channel admin rights of a user.
     * **Available**: ✅ both users and bots
     *
     */
    editAdminRights(params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** User ID */
        userId: InputPeerLike
        /** New admin rights */
        rights: Omit<tl.RawChatAdminRights, '_'>
        /** Custom admin rank */
        rank?: string
    }): Promise<void>
    /**
     * Get chat event log ("Recent actions" in official clients).
     *
     * Only available for supergroups and channels, and
     * requires (any) administrator rights.
     *
     * Results are returned in reverse chronological
     * order (i.e. newest first) and event IDs are
     * in direct chronological order (i.e. newer
     * events have bigger event ID)
     *
     * **Available**: 👤 users only
     *
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
            filters?: InputChatEventFilters

            /**
             * Limit the number of events returned.
             *
             * > Note: when using filters, there will likely be
             * > less events returned than specified here.
             * > This limit is only used to limit the number of
             * > events to fetch from the server.
             * >
             * > If you need to limit the number of events
             * > returned, use {@link iterChatEventLog} instead.
             *
             * @default  100
             */
            limit?: number
        },
    ): Promise<ChatEvent[]>
    /**
     * Get information about a single chat member
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     * @param userId  User ID, username, phone number, `"me"` or `"self"`
     * @throws UserNotParticipantError  In case given user is not a participant of a given chat
     */
    getChatMember(params: {
        /** Chat ID or username */
        chatId: InputPeerLike
        /** User ID, username, phone number, `"me"` or `"self"` */
        userId: InputPeerLike
    }): Promise<ChatMember>
    /**
     * Get a chunk of members of some chat.
     *
     * You can retrieve up to 200 members at once
     *
     * **Available**: ✅ both users and bots
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
             * > `all, banned, restricted, mention, contacts`
             */
            query?: string

            /**
             * Sequential number of the first member to be returned.
             */
            offset?: number

            /**
             * Maximum number of members to be retrieved.
             *
             * > **Note**: Telegram currently only allows you to ever retrieve at most
             * > 200 members, regardless of offset/limit. I.e. when passing
             * > `offset=201` nothing will ever be returned.
             *
             * @default  200
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
             *  - `mention`: get users that can be mentioned (see {@link tl.RawChannelParticipantsMentions})
             *
             *  Only used for channels and supergroups. Defaults to `recent`
             */
            type?: 'all' | 'banned' | 'restricted' | 'bots' | 'recent' | 'admins' | 'contacts' | 'mention'
        },
    ): Promise<ArrayWithTotal<ChatMember>>
    /**
     * Get preview information about a private chat.
     *
     * **Available**: 👤 users only
     *
     * @param inviteLink  Invite link
     * @throws MtArgumentError  In case invite link has invalid format
     * @throws MtPeerNotFoundError
     *   In case you are trying to get info about private chat that you have already joined.
     *   Use {@link getChat} or {@link getFullChat} instead.
     */
    getChatPreview(inviteLink: string): Promise<ChatPreview>
    /**
     * Get basic information about a chat.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  ID of the chat, its username or invite link
     * @throws MtArgumentError
     *   In case you are trying to get info about private chat that you haven't joined.
     *   Use {@link getChatPreview} instead.
     */
    getChat(chatId: InputPeerLike): Promise<Chat>
    /**
     * Get full information about a chat.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  ID of the chat, its username or invite link
     * @throws MtArgumentError
     *   In case you are trying to get info about private chat that you haven't joined.
     *   Use {@link getChatPreview} instead.
     */
    getFullChat(chatId: InputPeerLike): Promise<Chat>
    /**
     * Get nearby chats
     *
     * **Available**: 👤 users only
     *
     * @param latitude  Latitude of the location
     * @param longitude  Longitude of the location
     */
    getNearbyChats(latitude: number, longitude: number): Promise<Chat[]>
    /**
     * Iterate over chat event log.
     *
     * Small wrapper over {@link getChatEventLog}
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID
     * @param params
     */
    iterChatEventLog(
        chatId: InputPeerLike,
        params?: Parameters<typeof getChatEventLog>[2] & {
            /**
             * Total number of events to return.
             *
             * @default  Infinity
             */
            limit?: number

            /**
             * Chunk size, passed as `limit` to {@link getChatEventLog}.
             * Usually you don't need to touch this.
             *
             * @default  100
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<ChatEvent>
    /**
     * Iterate through chat members
     *
     * This method is a small wrapper over {@link getChatMembers},
     * which also handles duplicate entries (i.e. does not yield
     * the same member twice)
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     * @param params  Additional parameters
     */
    iterChatMembers(
        chatId: InputPeerLike,
        params?: Parameters<typeof getChatMembers>[2] & {
            /**
             * Chunk size, which will be passed as `limit` parameter
             * to {@link getChatMembers}. Usually you shouldn't care about this.
             *
             * Defaults to `200`
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<ChatMember>
    /**
     * Join a channel or supergroup
     *
     * When using with invite links, this method may throw RPC error
     * `INVITE_REQUEST_SENT`, which means that you need to wait for admin approval.
     * You will get into the chat once they do so.
     *
     * **Available**: 👤 users only
     *
     * @param chatId
     *   Chat identifier. Either an invite link (`t.me/joinchat/*`), a username (`@username`)
     *   or ID of the linked supergroup or channel.
     */
    joinChat(chatId: InputPeerLike): Promise<Chat>
    /**
     * Kick a user from a chat.
     *
     * This effectively bans a user and immediately unbans them.
     * **Available**: ✅ both users and bots
     *
     */
    kickChatMember(params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** User ID */
        userId: InputPeerLike
    }): Promise<void>
    /**
     * Leave a group chat, supergroup or channel
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     */
    leaveChat(
        chatId: InputPeerLike,
        params?: {
            /**
             * Whether to clear history after leaving (only for legacy group chats)
             */
            clear?: boolean
        },
    ): Promise<void>
    /**
     * Mark a chat as unread
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     */
    markChatUnread(chatId: InputPeerLike): Promise<void>
    /**
     * Reorder usernames
     *
     * **Available**: 👤 users only
     *
     * @param peerId  Bot, channel or "me"/"self"
     */
    reorderUsernames(peerId: InputPeerLike, order: string[]): Promise<void>
    /**
     * Restrict a user in a supergroup.
     * **Available**: ✅ both users and bots
     *
     */
    restrictChatMember(params: {
        /** Chat ID */
        chatId: InputPeerLike

        /** User ID */
        userId: InputPeerLike

        /**
         * Restrictions for the user. Note that unlike Bot API, this object contains
         * the restrictions, and not the permissions, i.e.
         * passing `sendMessages=true` will disallow the user to send messages,
         * and passing `{}` (empty object) will lift any restrictions
         */
        restrictions: Omit<tl.RawChatBannedRights, '_' | 'untilDate'>

        /**
         * Date when the user will be unrestricted.
         * When `number` is passed, UNIX time in ms is expected.
         * If this value is less than 30 seconds or more than 366 days in
         * the future, user will be restricted forever.
         *
         * @default  `0`, i.e. forever
         */
        until?: number | Date
    }): Promise<void>
    /**
     * Save or delete a draft message associated with some chat
     *
     * **Available**: 👤 users only
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param draft  Draft message, or `null` to delete.
     */
    saveDraft(chatId: InputPeerLike, draft: null | Omit<tl.RawDraftMessage, '_' | 'date'>): Promise<void>
    /**
     * Change default chat permissions for all members.
     *
     * You must be an administrator in the chat and have appropriate permissions.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     * @param restrictions
     *     Restrictions for the chat. Note that unlike Bot API, this object contains
     *     the restrictions, and not the permissions, i.e.
     *     passing `sendMessages=true` will disallow the users to send messages,
     *     and passing `{}` (empty object) will lift any restrictions
     */
    setChatDefaultPermissions(
        chatId: InputPeerLike,
        restrictions: Omit<tl.RawChatBannedRights, '_' | 'untilDate'>,
    ): Promise<Chat>
    /**
     * Change chat description
     *
     * You must be an administrator and have the appropriate permissions.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     * @param description  New chat description, 0-255 characters
     */
    setChatDescription(chatId: InputPeerLike, description: string): Promise<void>
    /**
     * Set a new chat photo or video.
     *
     * You must be an administrator and have the appropriate permissions.
     * **Available**: ✅ both users and bots
     *
     */
    setChatPhoto(params: {
        /** Chat ID or username */
        chatId: InputPeerLike

        /** Media type (photo or video) */

        type: 'photo' | 'video'

        /** Input media file */
        media: InputFileLike
        /**
         * When `type = video`, timestamp in seconds which will be shown
         * as a static preview.
         */
        previewSec?: number
    }): Promise<void>
    /**
     * Change chat title
     *
     * You must be an administrator and have the appropriate permissions.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     * @param title  New chat title, 1-255 characters
     */
    setChatTitle(chatId: InputPeerLike, title: string): Promise<void>
    /**
     * Set maximum Time-To-Live of all newly sent messages in the specified chat
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     * @param period  New TTL period, in seconds (or 0 to disable)
     */
    setChatTtl(chatId: InputPeerLike, period: number): Promise<void>
    /**
     * Change supergroup/channel username
     *
     * You must be an administrator and have the appropriate permissions.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID or current username
     * @param username  New username, or `null` to remove
     */
    setChatUsername(chatId: InputPeerLike, username: string | null): Promise<void>
    /**
     * Set supergroup's slow mode interval.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID or username
     * @param [seconds=0]
     *   Slow mode interval in seconds.
     *   Users will be able to send a message only once per this interval.
     *   Valid values are: `0 (off), 10, 30, 60 (1m), 300 (5m), 900 (15m) or 3600 (1h)`
     */
    setSlowMode(chatId: InputPeerLike, seconds?: number): Promise<void>
    /**
     * Set whether a chat has content protection (i.e. forwarding messages is disabled)
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID or username
     * @param [enabled=false]  Whether content protection should be enabled
     */
    toggleContentProtection(chatId: InputPeerLike, enabled?: boolean): Promise<void>
    /**
     * Toggle a collectible (Fragment) username
     *
     * > **Note**: non-collectible usernames must still be changed
     * > using {@link setUsername}/{@link setChatUsername}
     * **Available**: 👤 users only
     *
     */
    toggleFragmentUsername(params: {
        /** Peer ID whose username to toggle */
        peerId: InputPeerLike

        /**
         * Username to toggle
         */
        username: string

        /**
         * Whether to enable or disable the username
         */
        active: boolean
    }): Promise<void>
    /**
     * Set whether a channel/supergroup has join requests enabled.
     *
     * > **Note**: this method only affects primary invite links.
     * > Additional invite links may exist with the opposite setting.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID or username
     * @param [enabled=false]  Whether join requests should be enabled
     */
    toggleJoinRequests(chatId: InputPeerLike, enabled?: boolean): Promise<void>
    /**
     * Set whether a channel/supergroup has join-to-send setting enabled.
     *
     * This only affects discussion groups where users can send messages
     * without joining the group.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID or username
     * @param [enabled=false]  Whether join-to-send setting should be enabled
     */
    toggleJoinToSend(chatId: InputPeerLike, enabled?: boolean): Promise<void>
    /**
     * Unarchive one or more chats
     *
     * **Available**: 👤 users only
     *
     * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
     */
    unarchiveChats(chats: MaybeArray<InputPeerLike>): Promise<void>

    /**
     * Unban a user/channel from a supergroup or a channel,
     * or remove any restrictions that they have.
     * Unbanning does not add the user back to the chat, this
     * just allows the user to join the chat again, if they want.
     *
     * This method acts as a no-op in case a legacy group is passed.
     * **Available**: ✅ both users and bots
     *
     */
    unbanChatMember(params: {
        /** Chat ID */
        chatId: InputPeerLike

        /** User/channel ID who should be unbanned */
        participantId: InputPeerLike
    }): Promise<void>

    /**
     * Unban a user/channel from a supergroup or a channel,
     * or remove any restrictions that they have.
     * Unbanning does not add the user back to the chat, this
     * just allows the user to join the chat again, if they want.
     *
     * This method acts as a no-op in case a legacy group is passed.
     * **Available**: ✅ both users and bots
     *
     */
    unrestrictChatMember(params: {
        /** Chat ID */
        chatId: InputPeerLike

        /** User/channel ID who should be unbanned */
        participantId: InputPeerLike
    }): Promise<void>
    /**
     * Add an existing Telegram user as a contact
     * **Available**: 👤 users only
     *
     */
    addContact(params: {
        /** User ID, username or phone number */
        userId: InputPeerLike

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
    }): Promise<User>
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
     * **Available**: 👤 users only
     *
     */
    getContacts(): Promise<User[]>
    /**
     * Import contacts to your Telegram contacts list.
     *
     * **Available**: 👤 users only
     *
     * @param contacts  List of contacts
     */
    importContacts(
        contacts: PartialOnly<Omit<tl.RawInputPhoneContact, '_'>, 'clientId'>[],
    ): Promise<tl.contacts.RawImportedContacts>
    /**
     * Create a folder from given parameters
     *
     * ID for the folder is optional, if not
     * provided it will be derived automatically.
     *
     * **Available**: 👤 users only
     *
     * @param folder  Parameters for the folder
     * @returns  Newly created folder
     */
    createFolder(folder: PartialExcept<tl.RawDialogFilter, 'title'>): Promise<tl.RawDialogFilter>
    /**
     * Delete a folder by its ID
     *
     * **Available**: 👤 users only
     *
     * @param id  Folder ID or folder itself
     */
    deleteFolder(id: number | tl.RawDialogFilter): Promise<void>
    /**
     * Edit a folder with given modification
     *
     * **Available**: 👤 users only
     *
     * @returns  Modified folder
     */
    editFolder(params: {
        /**
         * Folder, folder ID or name.
         * Note that passing an ID or name will require re-fetching all folders,
         * and passing name might affect not the right folder if you have multiple
         * with the same name.
         */
        folder: tl.RawDialogFilter | number | string

        /** Modification to be applied to this folder */
        modification: Partial<Omit<tl.RawDialogFilter, 'id' | '_'>>
    }): Promise<tl.RawDialogFilter>
    /**
     * Find a folder by its parameter.
     *
     * > **Note**: Searching by title and/or emoji might not be
     * > accurate since you can set the same title and/or emoji
     * > to multiple folders.
     *
     * **Available**: ✅ both users and bots
     *
     * @param params  Search parameters. At least one must be set.
     */
    findFolder(params: {
        /** Folder title */
        title?: string
        /** Folder emoji */
        emoji?: string
        /** Folder ID */
        id?: number
    }): Promise<tl.RawDialogFilter | null>
    /**
     * Get list of folders.
     * **Available**: 👤 users only
     *
     */
    getFolders(): Promise<tl.TypeDialogFilter[]>

    _normalizeInputFolder(folder: InputDialogFolder): Promise<tl.TypeDialogFilter>
    /**
     * Get dialogs with certain peers.
     *
     * @param peers  Peers for which to fetch dialogs.
     */
    getPeerDialogs(peers: InputPeerLike): Promise<Dialog>
    /**
     * Get dialogs with certain peers.
     *
     * @param peers  Peers for which to fetch dialogs.
     */
    getPeerDialogs(peers: InputPeerLike[]): Promise<Dialog[]>
    /**
     * Iterate over dialogs.
     *
     * Note that due to Telegram API limitations,
     * ordering here can only be anti-chronological
     * (i.e. newest - first), and draft update date
     * is not considered when sorting.
     *
     * **Available**: 👤 users only
     *
     * @param params  Fetch parameters
     */
    iterDialogs(params?: {
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
         * @default  `Infinity`, i.e. all dialogs are fetched
         */
        limit?: number

        /**
         * Chunk size which will be passed to `messages.getDialogs`.
         * You shouldn't usually care about this.
         *
         * @default  100.
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
         * > **Note**: When using `include` mode with folders,
         * > pinned dialogs will only be fetched if all offset
         * > parameters are unset.
         *
         * @default  `include`.
         */
        pinned?: 'include' | 'exclude' | 'only' | 'keep'

        /**
         * How to handle archived chats?
         *
         * Whether to `keep` them among other dialogs,
         * `exclude` them from the list, or `only`
         * return archived dialogs
         *
         * Ignored for folders, since folders
         * themselves contain information about archived chats.
         *
         * > **Note**: when `pinned=only`, `archived=keep` will act as `only`
         * > because of Telegram API limitations.
         *
         * @default  `exclude`
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
         * {@link MtArgumentError} is thrown
         *
         * @default  <empty> (fetches from "All" folder)
         */
        folder?: InputDialogFolder

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
     * Reorder folders
     *
     * **Available**: 👤 users only
     *
     * @param order  New order of folders (folder IDs, where default = 0)
     */
    setFoldersOrder(order: number[]): Promise<void>
    /**
     * Download a file and return its contents as a Buffer.
     *
     * > **Note**: This method _will_ download the entire file
     * > into memory at once. This might cause an issue, so use wisely!
     *
     * **Available**: ✅ both users and bots
     *
     * @param params  File download parameters
     */
    downloadAsBuffer(params: FileDownloadParameters): Promise<Buffer>
    /**
     * Download a remote file to a local file (only for NodeJS).
     * Promise will resolve once the download is complete.
     *
     * **Available**: ✅ both users and bots
     *
     * @param filename  Local file name to which the remote file will be downloaded
     * @param params  File download parameters
     */
    downloadToFile(filename: string, params: FileDownloadParameters): Promise<void>
    /**
     * Download a file and return it as an iterable, which yields file contents
     * in chunks of a given size. Order of the chunks is guaranteed to be
     * consecutive.
     *
     * **Available**: 👤 users only
     *
     * @param params  Download parameters
     */
    downloadAsIterable(params: FileDownloadParameters): AsyncIterableIterator<Buffer>
    /**
     * Download a file and return it as a Node readable stream,
     * streaming file contents.
     *
     * **Available**: ✅ both users and bots
     *
     * @param params  File download parameters
     */
    downloadAsStream(params: FileDownloadParameters): Readable
    /**
     * **Available**: ✅ both users and bots
     *
     */
    _normalizeFileToDocument(
        file: InputFileLike | tl.TypeInputDocument,
        params: {
            progressCallback?: (uploaded: number, total: number) => void
        },
    ): Promise<tl.TypeInputDocument>
    /**
     * Normalize a {@link InputFileLike} to `InputFile`,
     * uploading it if needed.
     * **Available**: ✅ both users and bots
     *
     */
    _normalizeInputFile(
        input: InputFileLike,
        params: {
            progressCallback?: (uploaded: number, total: number) => void
            fileName?: string
            fileSize?: number
            fileMime?: string
        },
    ): Promise<tl.TypeInputFile>
    /**
     * Normalize an {@link InputMediaLike} to `InputMedia`,
     * uploading the file if needed.
     * **Available**: ✅ both users and bots
     *
     */
    _normalizeInputMedia(
        media: InputMediaLike,
        params: {
            parseMode?: string | null
            progressCallback?: (uploaded: number, total: number) => void
            uploadPeer?: tl.TypeInputPeer
        },
        uploadMedia?: boolean,
    ): Promise<tl.TypeInputMedia>

    /**
     * Upload a file to Telegram servers, without actually
     * sending a message anywhere. Useful when an `InputFile` is required.
     *
     * This method is quite low-level, and you should use other
     * methods like {@link sendMedia} that handle this under the hood.
     *
     * **Available**: ✅ both users and bots
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
         */
        fileSize?: number

        /**
         * If the file size is unknown, you can provide an estimate,
         * which will be used to determine appropriate part size.
         */
        estimatedSize?: number

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
         * Number of parts to be sent in parallel per connection.
         */
        requestsPerConnection?: number

        /**
         * Function that will be called after some part has been uploaded.
         *
         * @param uploaded  Number of bytes already uploaded
         * @param total  Total file size, if known
         */
        progressCallback?: (uploaded: number, total: number) => void
    }): Promise<UploadedFile>
    /**
     * Upload a media to Telegram servers, without actually
     * sending a message anywhere. Useful when File ID is needed.
     *
     * The difference with {@link uploadFile} is that
     * the returned object will act like a message media
     * and contain fields like File ID.
     *
     * **Available**: ✅ both users and bots
     *
     * @param media  Media to upload
     * @param [params={}]  Upload parameters
     */
    uploadMedia(
        media: InputMediaLike,
        params?: {
            peer?: InputPeerLike
            progressCallback?: (uploaded: number, total: number) => void
        },
    ): Promise<Extract<MessageMedia, Photo | RawDocument>>
    /**
     * Create a topic in a forum
     *
     * Only admins with `manageTopics` permission can do this.
     *
     * **Available**: ✅ both users and bots
     *
     * @returns  Service message for the created topic
     */
    createForumTopic(params: {
        /** Chat ID or username */
        chatId: InputPeerLike

        /**
         * Topic title
         */
        title: string

        /**
         * Icon of the topic.
         *
         * Can be a number (color in RGB, see {@link ForumTopic} static members for allowed values)
         * or a custom emoji ID.
         *
         * Icon color can't be changed after the topic is created.
         */
        icon?: number | tl.Long

        /**
         * Send as a specific channel
         */
        sendAs?: InputPeerLike
    }): Promise<Message>
    /**
     * Delete a forum topic and all its history
     *
     * **Available**: ✅ both users and bots
     *
     * @param chat  Chat or user ID, username, phone number, `"me"` or `"self"`
     * @param topicId  ID of the topic (i.e. its top message ID)
     */
    deleteForumTopicHistory(chat: InputPeerLike, topicId: number): Promise<void>
    /**
     * Modify a topic in a forum
     *
     * Only admins with `manageTopics` permission can do this.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     * @param topicId  ID of the topic (i.e. its top message ID)
     * @returns  Service message about the modification
     */
    editForumTopic(params: {
        /** Chat ID or username */
        chatId: InputPeerLike
        /** ID of the topic (i.e. its top message ID) */

        topicId: number
        /**
         * New topic title
         */
        title?: string

        /**
         * New icon of the topic.
         *
         * Can be a custom emoji ID, or `null` to remove the icon
         * and use static color instead
         */
        icon?: tl.Long | null
    }): Promise<Message>
    /**
     * Get a single forum topic by its ID
     *
     * @param chatId  Chat ID or username
     */
    getForumTopicsById(chatId: InputPeerLike, ids: number): Promise<ForumTopic>
    /**
     * Get forum topics by their IDs
     *
     * @param chatId  Chat ID or username
     */
    getForumTopicsById(chatId: InputPeerLike, ids: number[]): Promise<ForumTopic[]>
    /**
     * Get forum topics
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID or username
     */
    getForumTopics(
        chatId: InputPeerLike,
        params?: {
            /**
             * Search query
             */
            query?: string

            /**
             * Offset for pagination
             */
            offset?: GetForumTopicsOffset

            /**
             * Maximum number of topics to return.
             *
             * @default  100
             */
            limit?: number
        },
    ): Promise<ArrayPaginated<ForumTopic, GetForumTopicsOffset>>
    /**
     * Iterate over forum topics. Wrapper over {@link getForumTopics}.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     */
    iterForumTopics(
        chatId: InputPeerLike,
        params?: Parameters<typeof getForumTopics>[2] & {
            /**
             * Maximum number of topics to return.
             *
             * @default  `Infinity`, i.e. return all topics
             */
            limit?: number

            /**
             * Chunk size. Usually you shouldn't care about this.
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<ForumTopic>
    /**
     * Reorder pinned forum topics
     *
     * Only admins with `manageTopics` permission can do this.
     * **Available**: ✅ both users and bots
     *
     */
    reorderPinnedForumTopics(params: {
        /** Chat ID or username */
        chatId: InputPeerLike

        /**
         * Order of the pinned topics
         */
        order: number[]

        /**
         * Whether to un-pin topics not present in the order
         */
        force?: boolean
    }): Promise<void>
    /**
     * Toggle open/close status of a topic in a forum
     *
     * Only admins with `manageTopics` permission can do this.
     *
     * **Available**: ✅ both users and bots
     *
     * @returns  Service message about the modification
     */
    toggleForumTopicClosed(parmas: {
        /** Chat ID or username */
        chatId: InputPeerLike

        /** ID of the topic (i.e. its top message ID) */
        topicId: number

        /** Whether the topic should be closed */
        closed: boolean
    }): Promise<Message>
    /**
     * Toggle whether a topic in a forum is pinned
     *
     * Only admins with `manageTopics` permission can do this.
     * **Available**: ✅ both users and bots
     *
     */
    toggleForumTopicPinned(params: {
        /** Chat ID or username */
        chatId: InputPeerLike
        /** ID of the topic (i.e. its top message ID) */
        topicId: number
        /** Whether the topic should be pinned */
        pinned: boolean
    }): Promise<void>
    /**
     * Set whether a supergroup is a forum.
     *
     * Only owner of the supergroup can change this setting.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     * @param [enabled=false]  Whether the supergroup should be a forum
     */
    toggleForum(chatId: InputPeerLike, enabled?: boolean): Promise<void>
    /**
     * Toggle whether "General" topic in a forum is hidden or not
     *
     * Only admins with `manageTopics` permission can do this.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     * @param hidden  Whether the topic should be hidden
     * @returns  Service message about the modification
     */
    toggleGeneralTopicHidden(chatId: InputPeerLike, hidden: boolean): Promise<Message>
    /**
     * Create an additional invite link for the chat.
     *
     * You must be an administrator and have appropriate rights.
     *
     * **Available**: ✅ both users and bots
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

            /**
             * Whether users to be joined via this link need to be
             * approved by an admin
             */
            withApproval?: boolean
        },
    ): Promise<ChatInviteLink>
    /**
     * Edit an invite link. You can only edit non-primary
     * invite links.
     *
     * Only pass the fields that you want to modify.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID
     * @param link  Invite link to edit
     * @param params
     * @returns  Modified invite link
     */
    editInviteLink(params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** Invite link to edit */
        link: string
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

        /**
         * Whether users to be joined via this link need to be
         * approved by an admin
         */
        withApproval?: boolean
    }): Promise<ChatInviteLink>
    /**
     * Generate a new primary invite link for a chat,
     * old primary link is revoked.
     *
     * > **Note**: each administrator has their own primary invite link,
     * > and bots by default don't have one.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat IDs
     */
    exportInviteLink(chatId: InputPeerLike): Promise<ChatInviteLink>
    /**
     * Iterate over users who have joined
     * the chat with the given invite link.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     * @param params  Additional params
     */
    getInviteLinkMembers(
        chatId: InputPeerLike,
        params?: {
            /**
             * Invite link for which to get members
             */
            link?: string

            /**
             * Maximum number of users to return
             *
             * @default  100
             */
            limit?: number

            /**
             * Offset request/join date used as an anchor for pagination.
             */
            offsetDate?: Date | number

            /**
             * Offset user used as an anchor for pagination
             */
            offsetUser?: tl.TypeInputUser

            /**
             * Whether to get users who have requested to join
             * the chat but weren't accepted yet
             */
            requested?: boolean

            /**
             * Search for a user in the pending join requests list
             * (if passed, {@link requested} is assumed to be true)
             *
             * Doesn't work when {@link link} is set (Telegram limitation)
             */
            requestedSearch?: string
        },
    ): Promise<ArrayPaginated<ChatInviteLinkMember, { date: number; user: tl.TypeInputUser }>>
    /**
     * Get detailed information about an invite link
     *
     * **Available**: 👤 users only
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
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     * @param adminId  Admin who created the links
     * @param params
     */
    getInviteLinks(
        chatId: InputPeerLike,
        params?: {
            /**
             * Only return this admin's links.
             *
             * @default `"self"`
             */
            admin?: InputPeerLike

            /**
             * Whether to fetch revoked invite links
             */
            revoked?: boolean

            /**
             * Limit the number of invite links to be fetched.
             *
             * @default  100
             */
            limit?: number

            /**
             * Offset for pagination.
             */
            offset?: GetInviteLinksOffset
        },
    ): Promise<ArrayPaginated<ChatInviteLink, GetInviteLinksOffset>>
    /**
     * Get primary invite link of a chat
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     */
    getPrimaryInviteLink(chatId: InputPeerLike): Promise<ChatInviteLink>
    /**
     * Approve or deny multiple join requests to a chat.
     * **Available**: 👤 users only
     *
     */
    hideAllJoinRequests(params: {
        /** Chat/channel ID */
        chatId: InputPeerLike

        /** Whether to approve or deny the join requests */
        action: 'approve' | 'deny'

        /** Invite link to target */
        link?: string
    }): Promise<void>
    /**
     * Approve or deny join request to a chat.
     * **Available**: ✅ both users and bots
     *
     */
    hideJoinRequest(params: {
        /** Chat/channel ID */
        chatId: InputPeerLike
        /** User ID */
        user: InputPeerLike
        /** Whether to approve or deny the join request */
        action: 'approve' | 'deny'
    }): Promise<void>
    /**
     * Iterate over users who have joined
     * the chat with the given invite link.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID
     * @param params  Additional params
     */
    iterInviteLinkMembers(
        chatId: InputPeerLike,
        params?: Parameters<typeof getInviteLinkMembers>[2] & {
            /**
             * Maximum number of users to return
             *
             * @default  `Infinity`, i.e. all users are fetched
             */
            limit?: number

            /**
             * Chunk size which will be passed to `messages.getChatInviteImporters`.
             * You shouldn't usually care about this.
             *
             * @default  100.
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<ChatInviteLinkMember>
    /**
     * Iterate over invite links created by some administrator in the chat.
     *
     * As an administrator you can only get your own links
     * (i.e. `adminId = "self"`), as a creator you can get
     * any other admin's links.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID
     * @param adminId  Admin who created the links
     * @param params
     */
    iterInviteLinks(
        chatId: InputPeerLike,
        params?: Parameters<typeof getInviteLinks>[2] & {
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
        },
    ): AsyncIterableIterator<ChatInviteLink>
    /**
     * Revoke an invite link.
     *
     * If `link` is a primary invite link, a new invite link will be
     * generated automatically by Telegram
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID
     * @param link  Invite link to revoke
     * @returns  If `link` is a primary invite, newly generated invite link, otherwise the revoked link
     */
    revokeInviteLink(chatId: InputPeerLike, link: string): Promise<ChatInviteLink>
    /**
     * Close a poll sent by you.
     *
     * Once closed, poll can't be re-opened, and nobody
     * will be able to vote in it
     * **Available**: ✅ both users and bots
     *
     */
    closePoll(params: {
        /** Chat ID where this poll was found */
        chatId: InputPeerLike
        /** Message ID where this poll was found */
        message: number
    }): Promise<Poll>
    /**
     * Delete messages, including service messages.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param ids  Message(s) ID(s) to delete.
     */
    deleteMessages(
        chatId: InputPeerLike,
        ids: MaybeArray<number>,
        params?: {
            /**
             * Whether to "revoke" (i.e. delete for both sides).
             * Only used for chats and private chats.
             *
             * @default  true
             */
            revoke?: boolean
        },
    ): Promise<void>
    /**
     * Delete scheduled messages.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param ids  Message(s) ID(s) to delete.
     */
    deleteScheduledMessages(chatId: InputPeerLike, ids: MaybeArray<number>): Promise<void>
    /**
     * Edit sent inline message text, media and reply markup.
     *
     * **Available**: ✅ both users and bots
     *
     * @param messageId
     *     Inline message ID, either as a TL object, or as a
     *     TDLib and Bot API compatible string
     * @param params
     */
    editInlineMessage(params: {
        /**
         * Inline message ID, either as a TL object, or as a
         * TDLib and Bot API compatible string
         */
        messageId: tl.TypeInputBotInlineMessageID | string

        /**
         * New message text
         *
         * When `media` is passed, `media.caption` is used instead
         */
        text?: string | FormattedString<string>

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
    }): Promise<void>
    /**
     * Edit message text, media, reply markup and schedule date.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param message  Message or its ID
     * @param params
     */
    editMessage(params: {
        /** Chat ID */
        chatId: InputPeerLike
        /** Message to edit */
        message: number | Message

        /**
         * New message text
         *
         * When `media` is passed, `media.caption` is used instead
         */
        text?: string | FormattedString<string>

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
    }): Promise<Message>

    _findMessageInUpdate(res: tl.TypeUpdates, isEdit?: boolean): Message
    /**
     * Forward a single message.
     *
     * To forward with a caption, use another overload that takes an array of IDs.
     *
     * @param message  Message ID
     * @param params  Additional sending parameters
     * @returns  Newly sent, forwarded messages in the destination chat
     */
    forwardMessages(params: {
        /** Source chat ID, username, phone, `"me"` or `"self"` */
        fromChatId: InputPeerLike
        /** Destination chat ID, username, phone, `"me"` or `"self"` */
        toChatId: InputPeerLike
        /** Message ID */
        messages: number

        /**
         * Optionally, a caption for your forwarded message(s).
         * It will be sent as a separate message before the forwarded messages.
         *
         * You can either pass `caption` or `captionMedia`, passing both will
         * result in an error
         */
        caption?: string | FormattedString<string>

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
         *
         * You can also pass `0x7FFFFFFE`, this will send the message
         * once the peer is online
         */
        schedule?: Date | number

        /**
         * Whether to clear draft after sending this message (only used for caption)
         *
         * Defaults to `false`
         */
        clearDraft?: boolean

        /**
         * Whether to forward without author
         */
        noAuthor?: boolean

        /**
         * Whether to forward without caption (implies {@link noAuthor})
         */
        noCaption?: boolean

        /**
         * Whether to disallow further forwards of this message.
         *
         * Only for bots, works even if the target chat does not
         * have content protection.
         */
        forbidForwards?: boolean
    }): Promise<Message>
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
    forwardMessages(params: {
        /** Source chat ID, username, phone, `"me"` or `"self"` */
        fromChatId: InputPeerLike
        /** Destination chat ID, username, phone, `"me"` or `"self"` */
        toChatId: InputPeerLike
        /** Message IDs */
        messages: number[]

        /**
         * Optionally, a caption for your forwarded message(s).
         * It will be sent as a separate message before the forwarded messages.
         *
         * You can either pass `caption` or `captionMedia`, passing both will
         * result in an error
         */
        caption?: string | FormattedString<string>

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
         *
         * You can also pass `0x7FFFFFFE`, this will send the message
         * once the peer is online
         */
        schedule?: Date | number

        /**
         * Whether to clear draft after sending this message (only used for caption)
         *
         * Defaults to `false`
         */
        clearDraft?: boolean

        /**
         * Whether to forward without author
         */
        noAuthor?: boolean

        /**
         * Whether to forward without caption (implies {@link noAuthor})
         */
        noCaption?: boolean

        /**
         * Whether to disallow further forwards of this message.
         *
         * Only for bots, works even if the target chat does not
         * have content protection.
         */
        forbidForwards?: boolean
    }): Promise<MaybeArray<Message>>

    _getDiscussionMessage(peer: InputPeerLike, message: number): Promise<[tl.TypeInputPeer, number]>
    // public version of the same method because why not
    /**
     * Get discussion message for some channel post.
     *
     * Returns `null` if the post does not have a discussion
     * message.
     *
     * This method might throw `FLOOD_WAIT_X` error in case
     * the discussion message was not *yet* created. Error
     * is usually handled by the client, but if you disabled that,
     * you'll need to handle it manually.
     *
     * **Available**: 👤 users only
     *
     * @param peer  Channel where the post was found
     * @param message  ID of the channel post
     */
    getDiscussionMessage(peer: InputPeerLike, message: number): Promise<Message | null>
    /**
     * Get chat history.
     *
     * **Available**: 👤 users only
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
             * @default  100
             */
            limit?: number

            /**
             * Offset for pagination
             */
            offset?: GetHistoryOffset

            /**
             * Additional offset from {@link offset}, in resulting messages.
             *
             * This can be used for advanced use cases, like:
             * - Loading 20 messages newer than message with ID `MSGID`:
             *   `offset = MSGID, addOffset = -20, limit = 20`
             * - Loading 20 messages around message with ID `MSGID`:
             *   `offset = MSGID, addOffset = -10, limit = 20`
             *
             * @default  `0` (disabled)
             */

            addOffset?: number

            /**
             * Minimum message ID to return
             *
             * @default  `0` (disabled).
             */
            minId?: number

            /**
             * Maximum message ID to return.
             *
             * Unless {@link addOffset} is used, this will work the same as {@link offset}.
             *
             * @default  `0` (disabled).
             */
            maxId?: number

            /**
             * Whether to retrieve messages in reversed order (from older to recent),
             * starting from {@link offset} (inclusive).
             *
             * > **Note**: Using `reverse=true` requires you to pass offset from which to start
             * > fetching the messages "downwards". If you call `getHistory` with `reverse=true`
             * > and without any offset, it will return an empty array.
             *
             * @default false
             */
            reverse?: boolean
        },
    ): Promise<ArrayPaginated<Message, GetHistoryOffset>>
    /**
     * Get all messages inside of a message group
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID
     * @param message  ID of one of the messages in the group
     */
    getMessageGroup(chatId: InputPeerLike, message: number): Promise<Message[]>
    /**
     * Get reactions to a message.
     *
     * > Apps should short-poll reactions for visible messages
     * > (that weren't sent by the user) once every 15-30 seconds,
     * > but only if `message.reactions` is set
     *
     * @param chatId  ID of the chat with the message
     * @param messages  Message ID
     * @returns  Reactions to the corresponding message, or `null` if there are none
     */
    getMessageReactions(chatId: InputPeerLike, messages: number): Promise<MessageReactions | null>
    /**
     * Get reactions to messages.
     *
     * > Apps should short-poll reactions for visible messages
     * > (that weren't sent by the user) once every 15-30 seconds,
     * > but only if `message.reactions` is set
     *
     * @param chatId  ID of the chat with messages
     * @param messages  Message IDs
     * @returns  Reactions to corresponding messages, or `null` if there are none
     */
    getMessageReactions(chatId: InputPeerLike, messages: number[]): Promise<(MessageReactions | null)[]>
    /**
     * Get a single message from PM or legacy group by its ID.
     * For channels, use {@link getMessages}.
     *
     * Unlike {@link getMessages}, this method does not
     * check if the message belongs to some chat.
     *
     * @param messageId  Messages ID
     * @param [fromReply=false]
     *     Whether the reply to a given message should be fetched
     *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
     */
    getMessagesUnsafe(messageId: number, fromReply?: boolean): Promise<Message | null>
    /**
     * Get messages from PM or legacy group by their IDs.
     * For channels, use {@link getMessages}.
     *
     * Unlike {@link getMessages}, this method does not
     * check if the message belongs to some chat.
     *
     * Fot messages that were not found, `null` will be
     * returned at that position.
     *
     * @param messageIds  Messages IDs
     * @param [fromReply=false]
     *     Whether the reply to a given message should be fetched
     *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
     */
    getMessagesUnsafe(messageIds: number[], fromReply?: boolean): Promise<(Message | null)[]>
    /**
     * Get a single message in chat by its ID
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
     * @param messageId  Messages ID
     * @param [fromReply=false]
     *     Whether the reply to a given message should be fetched
     *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
     */
    getMessages(chatId: InputPeerLike, messageId: number, fromReply?: boolean): Promise<Message | null>
    /**
     * Get messages in chat by their IDs
     *
     * Fot messages that were not found, `null` will be
     * returned at that position.
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
     * @param messageIds  Messages IDs
     * @param [fromReply=false]
     *     Whether the reply to a given message should be fetched
     *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
     */
    getMessages(chatId: InputPeerLike, messageIds: number[], fromReply?: boolean): Promise<(Message | null)[]>
    /**
     * Get users who have reacted to the message.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     * @param messageId  Message ID
     * @param params
     */
    getReactionUsers(
        chatId: InputPeerLike,
        messageId: number,
        params?: {
            /**
             * Get only reactions with the specified emoji
             */
            emoji?: InputReaction

            /**
             * Limit the number of users returned.
             *
             * @default  100
             */
            limit?: number

            /**
             * Offset for pagination
             */
            offset?: GetReactionUsersOffset
        },
    ): Promise<ArrayPaginated<PeerReaction, GetReactionUsersOffset>>
    /**
     * Get a single scheduled message in chat by its ID
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
     * @param messageId  Scheduled message ID
     */
    getScheduledMessages(chatId: InputPeerLike, messageId: number): Promise<Message | null>
    /**
     * Get scheduled messages in chat by their IDs
     *
     * Fot messages that were not found, `null` will be
     * returned at that position.
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
     * @param messageIds  Scheduled messages IDs
     */
    getScheduledMessages(chatId: InputPeerLike, messageIds: number[]): Promise<(Message | null)[]>
    /**
     * Iterate over chat history. Wrapper over {@link getHistory}
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param params  Additional fetch parameters
     */
    iterHistory(
        chatId: InputPeerLike,
        params?: Parameters<typeof getHistory>[2] & {
            /**
             * Limits the number of messages to be retrieved.
             *
             * @default  Infinity, i.e. all messages
             */
            limit?: number

            /**
             * Chunk size. Usually you shouldn't care about this.
             *
             * @default  100
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<Message>
    /**
     * Iterate over users who have reacted to the message.
     *
     * Wrapper over {@link getReactionUsers}.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID
     * @param messageId  Message ID
     * @param params
     */
    iterReactionUsers(
        chatId: InputPeerLike,
        messageId: number,
        params?: Parameters<typeof getReactionUsers>[3] & {
            /**
             * Limit the number of events returned.
             *
             * @default  `Infinity`, i.e. all events are returned
             */
            limit?: number

            /**
             * Chunk size, usually not needed.
             *
             * @default  100
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<PeerReaction>
    /**
     * Search for messages globally from all of your chats.
     *
     * Iterable version of {@link searchGlobal}
     *
     * **Note**: Due to Telegram limitations, you can only get up to ~10000 messages
     *
     * **Available**: ✅ both users and bots
     *
     * @param params  Search parameters
     */
    iterSearchGlobal(
        params?: Parameters<typeof searchGlobal>[1] & {
            /**
             * Limits the number of messages to be retrieved.
             *
             * @default  `Infinity`, i.e. all messages are returned
             */
            limit?: number

            /**
             * Chunk size, which will be passed as `limit` parameter
             * for `messages.search`. Usually you shouldn't care about this.
             *
             * @default  100
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<Message>
    /**
     * Search for messages inside a specific chat
     *
     * Iterable version of {@link searchMessages}
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param params  Additional search parameters
     */
    iterSearchMessages(
        params?: Parameters<typeof searchMessages>[1] & {
            /**
             * Limits the number of messages to be retrieved.
             *
             * @default  `Infinity`, i.e. all messages are returned
             */
            limit?: number

            /**
             * Chunk size, which will be passed as `limit` parameter
             * for `messages.search`. Usually you shouldn't care about this.
             *
             * @default  `100`
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<Message>

    _parseEntities(
        text?: string | FormattedString<string>,
        mode?: string | null,
        entities?: tl.TypeMessageEntity[],
    ): Promise<[string, tl.TypeMessageEntity[] | undefined]>
    /**
     * Pin a message in a group, supergroup, channel or PM.
     *
     * For supergroups/channels, you must have appropriate permissions,
     * either as an admin, or as default permissions
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID, username, phone number, `"self"` or `"me"`
     * @param messageId  Message ID
     */
    pinMessage(
        chatId: InputPeerLike,
        messageId: number,
        params?: {
            /** Whether to send a notification (only for legacy groups and supergroups) */
            notify?: boolean
            /** Whether to pin for both sides (only for private chats) */
            bothSides?: boolean
        },
    ): Promise<void>
    /**
     * Mark chat history as read.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     */
    readHistory(
        chatId: InputPeerLike,
        params?: {
            /**
             * Message up until which to read history
             *
             * @default  0, i.e. read everything
             */
            maxId?: number

            /**
             * Whether to also clear all mentions in the chat
             */
            clearMentions?: boolean
        },
    ): Promise<void>
    /**
     * Mark all reactions in chat as read.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     */
    readReactions(chatId: InputPeerLike): Promise<void>
    /**
     * Search for messages globally from all of your chats
     *
     * **Note**: Due to Telegram limitations, you can only get up to ~10000 messages
     *
     * **Available**: 👤 users only
     *
     * @param params  Search parameters
     */
    searchGlobal(params?: {
        /**
         * Text query string. Use `"@"` to search for mentions.
         *
         * @default `""` (empty string)
         */
        query?: string

        /**
         * Limits the number of messages to be retrieved.
         *
         * @default  100
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
         * Offset data used for pagination
         */
        offset?: SearchGlobalOffset

        /**
         * Only return messages newer than this date
         */
        minDate?: Date | number

        /**
         * Only return messages older than this date
         */
        maxDate?: Date | number
    }): Promise<ArrayPaginated<Message, SearchGlobalOffset>>
    /**
     * Search for messages inside a specific chat
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param params  Additional search parameters
     */
    searchMessages(params?: {
        /**
         * Text query string. Required for text-only messages,
         * optional for media.
         *
         * @default  `""` (empty string)
         */
        query?: string

        /**
         * Chat where to search for messages.
         *
         * When empty, will search across common message box (i.e. private messages and legacy chats)
         */
        chatId?: InputPeerLike

        /**
         * Offset ID for the search. Only messages earlier than this ID will be returned.
         *
         * @default  `0` (starting from the latest message).
         */
        offset?: SearchMessagesOffset

        /**
         * Additional offset from {@link offset}, in resulting messages.
         *
         * This can be used for advanced use cases, like:
         * - Loading 20 results newer than message with ID `MSGID`:
         *   `offset = MSGID, addOffset = -20, limit = 20`
         * - Loading 20 results around message with ID `MSGID`:
         *   `offset = MSGID, addOffset = -10, limit = 20`
         *
         * When {@link offset} is not set, this will be relative to the last message
         *
         * @default  `0` (disabled)
         */
        addOffset?: number

        /**
         * Minimum message ID to return
         *
         * @default  `0` (disabled).
         */
        minId?: number

        /**
         * Maximum message ID to return.
         *
         * Unless {@link addOffset} is used, this will work the same as {@link offset}.
         *
         * @default  `0` (disabled).
         */
        maxId?: number

        /**
         * Minimum message date to return
         *
         * Defaults to `0` (disabled).
         */
        minDate?: number | Date

        /**
         * Maximum message date to return
         *
         * Defaults to `0` (disabled).
         */
        maxDate?: number | Date

        /**
         * Thread ID to return only messages from this thread.
         */
        threadId?: number

        /**
         * Limits the number of messages to be retrieved.
         *
         * @default  100
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
         * Search only for messages sent by a specific user.
         *
         * You can pass their marked ID, username, phone or `"me"` or `"self"`
         */
        fromUser?: InputPeerLike
    }): Promise<ArrayPaginated<Message, SearchMessagesOffset>>
    /**
     * Copy a message (i.e. send the same message,
     * but do not forward it).
     *
     * Note that if the message contains a webpage,
     * it will be copied simply as a text message,
     * and if the message contains an invoice,
     * it can't be copied.
     *
     * **Available**: ✅ both users and bots
     *
     * @param params
     */
    sendCopy(params: {
        /** Source chat ID */
        fromChatId: InputPeerLike
        /** Target chat ID */
        toChatId: InputPeerLike
        /** Message ID to forward */
        message: number
        /**
         * Whether to send this message silently.
         */
        silent?: boolean

        /**
         * If set, the message will be scheduled to this date.
         * When passing a number, a UNIX time in ms is expected.
         *
         * You can also pass `0x7FFFFFFE`, this will send the message
         * once the peer is online
         */
        schedule?: Date | number

        /**
         * New message caption (only used for media)
         */
        caption?: string | FormattedString<string>

        /**
         * Parse mode to use to parse `text` entities before sending
         * the message. Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

        /**
         * Message to reply to. Either a message object or message ID.
         *
         * For forums - can also be an ID of the topic (i.e. its top message ID)
         */
        replyTo?: number | Message

        /**
         * Whether to throw an error if {@link replyTo}
         * message does not exist.
         *
         * If that message was not found, `NotFoundError` is thrown,
         * with `text` set to `MESSAGE_NOT_FOUND`.
         *
         * Incurs an additional request, so only use when really needed.
         *
         * Defaults to `false`
         */
        mustReply?: boolean

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
    }): Promise<Message>
    /**
     * Send a group of media.
     *
     * To add a caption to the group, add caption to the first
     * media in the group and don't add caption for any other.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param medias  Medias contained in the message.
     * @param params  Additional sending parameters
     * @link InputMedia
     */
    sendMediaGroup(
        chatId: InputPeerLike,
        medias: (InputMediaLike | string)[],
        params?: {
            /**
             * Message to reply to. Either a message object or message ID.
             *
             * For forums - can also be an ID of the topic (i.e. its top message ID)
             */
            replyTo?: number | Message

            /**
             * Whether to throw an error if {@link replyTo}
             * message does not exist.
             *
             * If that message was not found, `NotFoundError` is thrown,
             * with `text` set to `MESSAGE_NOT_FOUND`.
             *
             * Incurs an additional request, so only use when really needed.
             *
             * Defaults to `false`
             */
            mustReply?: boolean

            /**
             * Message to comment to. Either a message object or message ID.
             *
             * This overwrites `replyTo` if it was passed
             */
            commentTo?: number | Message

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
             *
             * You can also pass `0x7FFFFFFE`, this will send the message
             * once the peer is online
             */
            schedule?: Date | number

            /**
             * Function that will be called after some part has been uploaded.
             * Only used when a file that requires uploading is passed,
             * and not used when uploading a thumbnail.
             *
             * @param index  Index of the media in the original array
             * @param uploaded  Number of bytes already uploaded
             * @param total  Total file size
             */
            progressCallback?: (index: number, uploaded: number, total: number) => void

            /**
             * Whether to clear draft after sending this message.
             *
             * Defaults to `false`
             */
            clearDraft?: boolean

            /**
             * Whether to disallow further forwards of this message.
             *
             * Only for bots, works even if the target chat does not
             * have content protection.
             */
            forbidForwards?: boolean

            /**
             * Peer to use when sending the message.
             */
            sendAs?: InputPeerLike
        },
    ): Promise<Message[]>
    /**
     * Send a single media (a photo or a document-based media)
     *
     * **Available**: ✅ both users and bots
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
             * Override caption for `media`.
             *
             * Can be used, for example. when using File IDs
             * or when using existing InputMedia objects.
             */
            caption?: string | FormattedString<string>

            /**
             * Override entities for `media`.
             *
             * Can be used, for example. when using File IDs
             * or when using existing InputMedia objects.
             */
            entities?: tl.TypeMessageEntity[]

            /**
             * Message to reply to. Either a message object or message ID.
             *
             * For forums - can also be an ID of the topic (i.e. its top message ID)
             */
            replyTo?: number | Message

            /**
             * Whether to throw an error if {@link replyTo}
             * message does not exist.
             *
             * If that message was not found, `NotFoundError` is thrown,
             * with `text` set to `MESSAGE_NOT_FOUND`.
             *
             * Incurs an additional request, so only use when really needed.
             *
             * Defaults to `false`
             */
            mustReply?: boolean

            /**
             * Message to comment to. Either a message object or message ID.
             *
             * This overwrites `replyTo` if it was passed
             */
            commentTo?: number | Message

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
             *
             * You can also pass `0x7FFFFFFE`, this will send the message
             * once the peer is online
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

            /**
             * Whether to disallow further forwards of this message.
             *
             * Only for bots, works even if the target chat does not
             * have content protection.
             */
            forbidForwards?: boolean

            /**
             * Peer to use when sending the message.
             */
            sendAs?: InputPeerLike
        },
    ): Promise<Message>
    /**
     * Send or remove a reaction.
     *
     * **Available**: 👤 users only
     *
     * @returns  Message to which the reaction was sent
     */
    sendReaction(params: {
        /** Chat ID with the message to react to */
        chatId: InputPeerLike
        /** Message ID to react to */
        message: number
        /** Reaction emoji (or `null` to remove reaction) */
        emoji?: InputReaction | null
        /** Whether to use a big reaction */
        big?: boolean
    }): Promise<Message>
    /**
     * Send s previously scheduled message.
     *
     * Note that if the message belongs to a media group,
     * the entire group will be sent, but only
     * the first message will be returned (in this overload).
     *
     * @param peer  Chat where the messages were scheduled
     * @param id  ID of the message
     */
    sendScheduled(peer: InputPeerLike, id: number): Promise<Message>
    /**
     * Send previously scheduled message(s)
     *
     * Note that if the message belongs to a media group,
     * the entire group will be sent, and all the messages
     * will be returned.
     *
     * @param peer  Chat where the messages were scheduled
     * @param ids  ID(s) of the messages
     */
    sendScheduled(peer: InputPeerLike, ids: number[]): Promise<Message[]>
    /**
     * Send a text message
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
     * @param text  Text of the message
     * @param params  Additional sending parameters
     */
    sendText(
        chatId: InputPeerLike,
        text: string | FormattedString<string>,
        params?: {
            /**
             * Message to reply to. Either a message object or message ID.
             *
             * For forums - can also be an ID of the topic (i.e. its top message ID)
             */
            replyTo?: number | Message

            /**
             * Whether to throw an error if {@link replyTo}
             * message does not exist.
             *
             * If that message was not found, `NotFoundError` is thrown,
             * with `text` set to `MESSAGE_NOT_FOUND`.
             *
             * Incurs an additional request, so only use when really needed.
             *
             * Defaults to `false`
             */
            mustReply?: boolean

            /**
             * Message to comment to. Either a message object or message ID.
             *
             * This overwrites `replyTo` if it was passed
             */
            commentTo?: number | Message

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
             *
             * You can also pass `0x7FFFFFFE`, this will send the message
             * once the peer is online
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

            /**
             * Whether to disallow further forwards of this message.
             *
             * Only for bots, works even if the target chat does not
             * have content protection.
             */
            forbidForwards?: boolean

            /**
             * Peer to use when sending the message.
             */
            sendAs?: InputPeerLike
        },
    ): Promise<Message>
    /**
     * Sends a current user/bot typing event
     * to a conversation partner or group.
     *
     * This status is set for 6 seconds, and is
     * automatically cancelled if you send a
     * message.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID
     * @param [status='typing']  Typing status
     * @param params
     */
    sendTyping(
        chatId: InputPeerLike,
        status?: TypingStatus | tl.TypeSendMessageAction,
        params?: {
            /**
             * For `upload_*` and history import actions, progress of the upload
             */
            progress?: number

            /**
             * For comment threads, ID of the thread (i.e. top message)
             */
            threadId?: number
        },
    ): Promise<void>
    /**
     * Send or retract a vote in a poll.
     * **Available**: 👤 users only
     *
     */
    sendVote(params: {
        /** Chat ID where this poll was found */
        chatId: InputPeerLike
        /** Message ID where this poll was found */
        message: number
        /**
         * Selected options, or `null` to retract.
         * You can pass indexes of the answers or the `Buffer`s
         * representing them. In case of indexes, the poll will first
         * be requested from the server.
         */
        options: null | MaybeArray<number | Buffer>
    }): Promise<Poll>
    /**
     * Translate message text to a given language.
     *
     * Returns `null` if it could not translate the message.
     * **Available**: 👤 users only
     *
     */
    translateMessage(params: {
        /** Chat or user ID */
        chatId: InputPeerLike
        /** Identifier of the message to translate */
        messageId: number
        /** Target language (two-letter ISO 639-1 language code) */
        toLanguage: string
    }): Promise<[string, MessageEntity[]] | null>
    /**
     * Translate text to a given language.
     *
     * Returns `null` if it could not translate the message.
     *
     * > **Note**: For now doesn't seem to work, returns null for all messages.
     *
     * **Available**: 👤 users only
     *
     * @param text  Text to translate
     * @param toLanguage  Target language (two-letter ISO 639-1 language code)
     */
    translateText(text: string, toLanguage: string): Promise<string | null>
    /**
     * Unpin all pinned messages in a chat.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat or user ID
     */
    unpinAllMessages(
        chatId: InputPeerLike,
        params?: {
            /**
             * For forums - unpin only messages from the given topic
             */
            topicId?: number
        },
    ): Promise<void>
    /**
     * Unpin a message in a group, supergroup, channel or PM.
     *
     * For supergroups/channels, you must have appropriate permissions,
     * either as an admin, or as default permissions
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID, username, phone number, `"self"` or `"me"`
     * @param messageId  Message ID
     */
    unpinMessage(chatId: InputPeerLike, messageId: number): Promise<void>
    /**
     * Create a new takeout session
     *
     * **Available**: 👤 users only
     *
     * @param params  Takeout session parameters
     */
    initTakeoutSession(params: Omit<tl.account.RawInitTakeoutSessionRequest, '_'>): Promise<TakeoutSession>
    /**
     * Normalize {@link InputPrivacyRule}[] to `tl.TypeInputPrivacyRule`,
     * resolving the peers if needed.
     * **Available**: ✅ both users and bots
     *
     */
    _normalizePrivacyRules(rules: InputPrivacyRule[]): Promise<tl.TypeInputPrivacyRule[]>

    getParseModesState(): ParseModesState
    /**
     * Register a given {@link IMessageEntityParser} as a parse mode
     * for messages. When this method is first called, given parse
     * mode is also set as default.
     *
     * **Available**: ✅ both users and bots
     *
     * @param parseMode  Parse mode to register
     * @throws MtClientError  When the parse mode with a given name is already registered.
     */
    registerParseMode(parseMode: IMessageEntityParser): void
    /**
     * Unregister a parse mode by its name.
     * Will silently fail if given parse mode does not exist.
     *
     * Also updates the default parse mode to the next one available, if any
     *
     * **Available**: ✅ both users and bots
     *
     * @param name  Name of the parse mode to unregister
     */
    unregisterParseMode(name: string): void
    /**
     * Get a {@link IMessageEntityParser} registered under a given name (or a default one).
     *
     * **Available**: ✅ both users and bots
     *
     * @param name  Name of the parse mode which parser to get.
     * @throws MtClientError  When the provided parse mode is not registered
     * @throws MtClientError  When `name` is omitted and there is no default parse mode
     */
    getParseMode(name?: string | null): IMessageEntityParser
    /**
     * Set a given parse mode as a default one.
     *
     * **Available**: ✅ both users and bots
     *
     * @param name  Name of the parse mode
     * @throws MtClientError  When given parse mode is not registered.
     */
    setDefaultParseMode(name: string): void
    /**
     * Change your 2FA password
     * **Available**: 👤 users only
     *
     */
    changeCloudPassword(params: {
        /** Current password as plaintext */
        currentPassword: string
        /** New password as plaintext */
        newPassword: string
        /** Hint for the new password */
        hint?: string
    }): Promise<void>
    /**
     * Enable 2FA password on your account
     *
     * Note that if you pass `email`, `EmailUnconfirmedError` may be
     * thrown, and you should use {@link verifyPasswordEmail},
     * {@link resendPasswordEmail} or {@link cancelPasswordEmail},
     * and the call this method again
     * **Available**: 👤 users only
     *
     */
    enableCloudPassword(params: {
        /** 2FA password as plaintext */
        password: string
        /** Hint for the new password */
        hint?: string
        /** Recovery email */
        email?: string
    }): Promise<void>
    /**
     * Verify an email to use as 2FA recovery method
     *
     * **Available**: 👤 users only
     *
     * @param code  Code which was sent via email
     */
    verifyPasswordEmail(code: string): Promise<void>
    /**
     * Resend the code to verify an email to use as 2FA recovery method.
     * **Available**: 👤 users only
     *
     */
    resendPasswordEmail(): Promise<void>
    /**
     * Cancel the code that was sent to verify an email to use as 2FA recovery method
     * **Available**: 👤 users only
     *
     */
    cancelPasswordEmail(): Promise<void>
    /**
     * Remove 2FA password from your account
     *
     * **Available**: 👤 users only
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
     * **Available**: ✅ both users and bots
     *
     * @param setId  Sticker set short name or TL object with input sticker set
     * @param sticker  Sticker to be added
     * @param params
     * @returns  Modfiied sticker set
     */
    addStickerToSet(
        setId: InputStickerSet,
        sticker: InputStickerSetItem,
        params?: {
            /**
             * Upload progress callback
             *
             * @param uploaded  Number of bytes uploaded
             * @param total  Total file size
             */
            progressCallback?: (uploaded: number, total: number) => void
        },
    ): Promise<StickerSet>
    /**
     * Create a new sticker set.
     *
     * This is the only sticker-related method that
     * users can use (they allowed it with the "import stickers" update)
     *
     * **Available**: ✅ both users and bots
     *
     * @param params
     * @returns  Newly created sticker set
     */
    createStickerSet(params: {
        /**
         * Owner of the sticker set (must be user).
         *
         * If this pack is created from a user account,
         * can only be `"self"`
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
         * and (for bots) must end with `_by_<bot username>`
         * (`<bot username>` is case-insensitive).
         */
        shortName: string

        /**
         * Type of the stickers in this set.
         * Defaults to `sticker`, i.e. regular stickers.
         *
         * Creating `emoji` stickers via API is not supported yet
         */
        type?: StickerType

        /**
         * File source type for the stickers in this set.
         * Defaults to `static`, i.e. regular WEBP stickers.
         */
        sourceType?: StickerSourceType

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
        progressCallback?: (idx: number, uploaded: number, total: number) => void
    }): Promise<StickerSet>
    /**
     * Delete a sticker from a sticker set
     *
     * Only for bots, and the sticker set must
     * have been created by this bot.
     *
     * **Available**: ✅ both users and bots
     *
     * @param sticker
     *     TDLib and Bot API compatible File ID, or a
     *     TL object representing a sticker to be removed
     * @returns  Modfiied sticker set
     */
    deleteStickerFromSet(
        sticker: string | tdFileId.RawFullRemoteFileLocation | tl.TypeInputDocument,
    ): Promise<StickerSet>
    /**
     * Get custom emoji stickers by their IDs
     *
     * **Available**: ✅ both users and bots
     *
     * @param ids  IDs of the stickers (as defined in {@link MessageEntity.emojiId})
     */
    getCustomEmojis(ids: tl.Long[]): Promise<Sticker[]>
    /**
     * Get a list of all installed sticker packs
     *
     * > **Note**: This method returns *brief* meta information about
     * > the packs, that does not include the stickers themselves.
     * > Use {@link StickerSet.getFull} or {@link getStickerSet}
     * > to get a stickerset that will include the stickers
     * **Available**: 👤 users only
     *
     */
    getInstalledStickers(): Promise<StickerSet[]>
    /**
     * Get a sticker pack and stickers inside of it.
     *
     * **Available**: ✅ both users and bots
     *
     * @param setId  Sticker pack short name, dice emoji, `"emoji"` for animated emojis or input ID
     */
    getStickerSet(setId: InputStickerSet): Promise<StickerSet>
    /**
     * Move a sticker in a sticker set
     * to another position
     *
     * Only for bots, and the sticker set must
     * have been created by this bot.
     *
     * **Available**: ✅ both users and bots
     *
     * @param sticker
     *     TDLib and Bot API compatible File ID, or a
     *     TL object representing a sticker to be removed
     * @param position  New sticker position (starting from 0)
     * @returns  Modfiied sticker set
     */
    moveStickerInSet(
        sticker: string | tdFileId.RawFullRemoteFileLocation | tl.TypeInputDocument,
        position: number,
    ): Promise<StickerSet>
    /**
     * Set group sticker set for a supergroup
     *
     * **Available**: ✅ both users and bots
     *
     * @param setId  Sticker set short name or a TL object with input sticker set
     * @param thumb  Sticker set thumbnail
     * @param params
     * @returns  Modified sticker set
     */
    setChatStickerSet(chatId: InputPeerLike, setId: InputStickerSet): Promise<void>
    /**
     * Set sticker set thumbnail
     *
     * **Available**: ✅ both users and bots
     *
     * @param id  Sticker set short name or a TL object with input sticker set
     * @param thumb  Sticker set thumbnail
     * @param params
     * @returns  Modified sticker set
     */
    setStickerSetThumb(
        id: InputStickerSet,
        thumb: InputFileLike | tl.TypeInputDocument,
        params?: {
            /**
             * Upload progress callback
             *
             * @param uploaded  Number of bytes uploaded
             * @param total  Total file size
             */
            progressCallback?: (uploaded: number, total: number) => void
        },
    ): Promise<StickerSet>
    /**
     * Boost a given channel
     *
     * **Available**: ✅ both users and bots
     *
     * @param peerId  Peer ID to boost
     */
    applyBoost(peerId: InputPeerLike): Promise<void>
    /**
     * Check if the current user can apply boost to a given channel
     *
     * **Available**: ✅ both users and bots
     *
     * @param peerId  Peer ID whose stories to fetch
     * @returns
     *   - `{ can: true }` if the user can apply boost
     *      - `.current` - {@link Chat} that the current user is currently boosting, if any
     *   - `{ can: false }` if the user can't apply boost
     *      - `.reason == "already_boosting"` if the user is already boosting this channel
     *      - `.reason == "need_premium"` if the user needs Premium to boost this channel
     *      - `.reason == "timeout"` if the user has recently boosted a channel and needs to wait
     *        (`.until` contains the date until which the user needs to wait)
     */
    canApplyBoost(peerId: InputPeerLike): Promise<CanApplyBoostResult>
    /**
     * Check if the current user can post stories as a given peer
     *
     * **Available**: ✅ both users and bots
     *
     * @param peerId  Peer ID whose stories to fetch
     * @returns
     *   - `true` if the user can post stories
     *   - `"need_admin"` if the user is not an admin in the chat
     *   - `"need_boosts"` if the channel doesn't have enough boosts
     */
    canSendStory(peerId: InputPeerLike): Promise<CanSendStoryResult>
    /**
     * Delete a story
     *
     * **Available**: ✅ both users and bots
     *
     * @returns  IDs of stories that were removed
     */
    deleteStories(params: {
        /**
         * Story IDs to delete
         */
        ids: MaybeArray<number>

        /**
         * Peer ID whose stories to delete
         *
         * @default  `self`
         */
        peer?: InputPeerLike
    }): Promise<number[]>
    /**
     * Edit a sent story
     *
     * **Available**: ✅ both users and bots
     *
     * @returns  Edited story
     */
    editStory(params: {
        /**
         * Story ID to edit
         */
        id: number

        /**
         * Peer ID to whose story to edit
         *
         * @default  `self`
         */
        peer?: InputPeerLike

        /**
         * Media contained in a story. Currently can only be a photo or a video.
         */
        media?: InputMediaLike

        /**
         * Override caption for {@link media}
         */
        caption?: string | FormattedString<string>

        /**
         * Override entities for {@link media}
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * Parse mode to use to parse entities before sending
         * the message. Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

        /**
         * Interactive elements to add to the story
         */
        interactiveElements?: tl.TypeMediaArea[]

        /**
         * Privacy rules to apply to the story
         *
         * @default  "Everyone"
         */
        privacyRules?: InputPrivacyRule[]
    }): Promise<Story>

    _findStoryInUpdate(res: tl.TypeUpdates): Story
    /**
     * Get all stories (e.g. to load the top bar)
     * **Available**: ✅ both users and bots
     *
     */
    getAllStories(params?: {
        /**
         * Offset from which to fetch stories
         */
        offset?: string

        /**
         * Whether to fetch stories from "archived" (or "hidden") peers
         */
        archived?: boolean
    }): Promise<AllStories>
    /**
     * Get information about boosts in a channel
     *
     * **Available**: 👤 users only
     *
     * @returns  IDs of stories that were removed
     */
    getBoostStats(peerId: InputPeerLike): Promise<BoostStats>
    /**
     * Get boosters of a channel
     *
     * **Available**: 👤 users only
     *
     * @returns  IDs of stories that were removed
     */
    getBoosters(
        peerId: InputPeerLike,
        params?: {
            /**
             * Offset for pagination
             */
            offset?: string

            /**
             * Maximum number of boosters to fetch
             *
             * @default  100
             */
            limit?: number
        },
    ): Promise<ArrayPaginated<Booster, string>>
    /**
     * Get stories of a given peer
     *
     * **Available**: ✅ both users and bots
     *
     * @param peerId  Peer ID whose stories to fetch
     */
    getPeerStories(peerId: InputPeerLike): Promise<PeerStories>
    /**
     * Get profile stories
     * **Available**: ✅ both users and bots
     *
     */
    getProfileStories(
        peerId: InputPeerLike,
        params?: {
            /**
             * Kind of stories to fetch
             * - `pinned` - stories pinned to the profile and visible to everyone
             * - `archived` - "archived" stories that can later be pinned, only visible to the owner
             *
             * @default  `pinned`
             */
            kind?: 'pinned' | 'archived'

            /**
             * Offset ID for pagination
             */
            offsetId?: number

            /**
             * Maximum number of stories to fetch
             *
             * @default  100
             */
            limit?: number
        },
    ): Promise<ArrayPaginated<Story, number>>
    /**
     * Get a single story by its ID
     *
     * @param peerId  Peer ID whose stories to fetch
     * @param storyId  Story ID
     */
    getStoriesById(peerId: InputPeerLike, storyId: number): Promise<Story>
    /**
     * Get multiple stories by their IDs
     *
     * @param peerId  Peer ID whose stories to fetch
     * @param storyIds  Story IDs
     */
    getStoriesById(peerId: InputPeerLike, storyIds: number[]): Promise<Story[]>
    /**
     * Get brief information about story interactions.
     */
    getStoriesInteractions(peerId: InputPeerLike, storyId: number): Promise<StoryInteractions>
    /**
     * Get brief information about stories interactions.
     *
     * The result will be in the same order as the input IDs
     */
    getStoriesInteractions(peerId: InputPeerLike, storyIds: number[]): Promise<StoryInteractions[]>
    /**
     * Generate a link to a story.
     *
     * Basically the link format is `t.me/<username>/s/<story_id>`,
     * and if the user doesn't have a username, `USER_PUBLIC_MISSING` is thrown.
     *
     * I have no idea why is this an RPC call, but whatever
     * **Available**: ✅ both users and bots
     *
     */
    getStoryLink(peerId: InputPeerLike, storyId: number): Promise<string>
    /**
     * Get viewers list of a story
     * **Available**: ✅ both users and bots
     *
     */
    getStoryViewers(
        peerId: InputPeerLike,
        storyId: number,
        params?: {
            /**
             * Whether to only fetch viewers from contacts
             */
            onlyContacts?: boolean

            /**
             * How to sort the results?
             * - `reaction` - by reaction (viewers who has reacted are first), then by date (newest first)
             * - `date` - by date, newest first
             *
             * @default  `reaction`
             */
            sortBy?: 'reaction' | 'date'

            /**
             * Search query
             */
            query?: string

            /**
             * Offset ID for pagination
             */
            offset?: string

            /**
             * Maximum number of viewers to fetch
             *
             * @default  100
             */
            limit?: number
        },
    ): Promise<StoryViewersList>
    /**
     * Hide own stories views (activate so called "stealth mode")
     *
     * Currently has a cooldown of 1 hour, and throws FLOOD_WAIT error if it is on cooldown.
     * **Available**: ✅ both users and bots
     *
     */
    hideMyStoriesViews(params?: {
        /**
         * Whether to hide views from the last 5 minutes
         *
         * @default  true
         */
        past?: boolean

        /**
         * Whether to hide views for the next 25 minutes
         *
         * @default  true
         */
        future?: boolean
    }): Promise<StoriesStealthMode>
    /**
     * Increment views of one or more stories.
     *
     * This should be used for pinned stories, as they can't
     * be marked as read when the user sees them ({@link Story#isActive} == false)
     *
     * **Available**: ✅ both users and bots
     *
     * @param peerId  Peer ID whose stories to mark as read
     * @param ids  ID(s) of the stories to increment views of (max 200)
     */
    incrementStoriesViews(peerId: InputPeerLike, ids: MaybeArray<number>): Promise<boolean>
    /**
     * Iterate over all stories (e.g. to load the top bar)
     *
     * Wrapper over {@link getAllStories}
     * **Available**: ✅ both users and bots
     *
     */
    iterAllStories(
        params?: Parameters<typeof getAllStories>[1] & {
            /**
             * Maximum number of stories to fetch
             *
             * @default  Infinity
             */
            limit?: number
        },
    ): AsyncIterableIterator<PeerStories>
    /**
     * Iterate over boosters of a channel.
     *
     * Wrapper over {@link getBoosters}
     *
     * **Available**: ✅ both users and bots
     *
     * @returns  IDs of stories that were removed
     */
    iterBoosters(
        peerId: InputPeerLike,
        params?: Parameters<typeof getBoosters>[2] & {
            /**
             * Total number of boosters to fetch
             *
             * @default  Infinity, i.e. fetch all boosters
             */
            limit?: number

            /**
             * Number of boosters to fetch per request
             * Usually you don't need to change this
             *
             * @default  100
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<Booster>
    /**
     * Iterate over profile stories. Wrapper over {@link getProfileStories}
     * **Available**: ✅ both users and bots
     *
     */
    iterProfileStories(
        peerId: InputPeerLike,
        params?: Parameters<typeof getProfileStories>[2] & {
            /**
             * Total number of stories to fetch
             *
             * @default  `Infinity`, i.e. fetch all stories
             */
            limit?: number

            /**
             * Number of stories to fetch per request.
             * Usually you shouldn't care about this.
             *
             * @default  100
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<Story>
    /**
     * Iterate over viewers list of a story.
     * Wrapper over {@link getStoryViewers}
     * **Available**: ✅ both users and bots
     *
     */
    iterStoryViewers(
        peerId: InputPeerLike,
        storyId: number,
        params?: Parameters<typeof getStoryViewers>[3] & {
            /**
             * Total number of viewers to fetch
             *
             * @default  Infinity, i.e. fetch all viewers
             */
            limit?: number

            /**
             * Number of viewers to fetch per request.
             * Usually you don't need to change this.
             *
             * @default  100
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<StoryViewer>
    /**
     * Mark all stories up to a given ID as read
     *
     * This should only be used for "active" stories ({@link Story#isActive} == false)
     *
     * **Available**: ✅ both users and bots
     *
     * @param peerId  Peer ID whose stories to mark as read
     * @returns  IDs of the stores that were marked as read
     */
    readStories(peerId: InputPeerLike, maxId: number): Promise<number[]>
    /**
     * Report a story (or multiple stories) to the moderation team
     * **Available**: ✅ both users and bots
     *
     */
    reportStory(
        peerId: InputPeerLike,
        storyIds: MaybeArray<number>,
        params?: {
            /**
             * Reason for reporting
             *
             * @default  inputReportReasonSpam
             */
            reason?: tl.TypeReportReason

            /**
             * Additional comment to the report
             */
            message?: string
        },
    ): Promise<void>
    /**
     * Send (or remove) a reaction to a story
     * **Available**: ✅ both users and bots
     *
     */
    sendStoryReaction(params: {
        peerId: InputPeerLike
        storyId: number
        reaction: InputReaction
        /**
         * Whether to add this reaction to recently used
         */
        addToRecent?: boolean
    }): Promise<void>
    /**
     * Send a story
     *
     * **Available**: ✅ both users and bots
     *
     * @returns  Created story
     */
    sendStory(params: {
        /**
         * Peer ID to send story as
         *
         * @default  `self`
         */
        peer?: InputPeerLike

        /**
         * Media contained in a story. Currently can only be a photo or a video.
         *
         * You can also pass TDLib and Bot API compatible File ID,
         * which will be wrapped in {@link InputMedia.auto}
         */
        media: InputMediaLike | string

        /**
         * Override caption for {@link media}
         */
        caption?: string | FormattedString<string>

        /**
         * Override entities for {@link media}
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * Parse mode to use to parse entities before sending
         * the message. Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

        /**
         * Whether to automatically pin this story to the profile
         */
        pinned?: boolean

        /**
         * Whether to disallow sharing this story
         */
        forbidForwards?: boolean

        /**
         * Interactive elements to add to the story
         */
        interactiveElements?: tl.TypeMediaArea[]

        /**
         * Privacy rules to apply to the story
         *
         * @default  "Everyone"
         */
        privacyRules?: InputPrivacyRule[]

        /**
         * TTL period of the story, in seconds
         *
         * @default  86400
         */
        period?: number
    }): Promise<Story>
    /**
     * Toggle whether peer's stories are archived (hidden) or not.
     *
     * This **does not** archive the chat with that peer, only stories.
     * **Available**: ✅ both users and bots
     *
     */
    togglePeerStoriesArchived(peerId: InputPeerLike, archived: boolean): Promise<void>
    /**
     * Toggle one or more stories pinned status
     *
     * **Available**: ✅ both users and bots
     *
     * @returns  IDs of stories that were toggled
     */
    toggleStoriesPinned(params: {
        /**
         * Story ID(s) to toggle
         */
        ids: MaybeArray<number>

        /**
         * Whether to pin or unpin the story
         */
        pinned: boolean

        /**
         * Peer ID whose stories to toggle
         *
         * @default  `self`
         */
        peer?: InputPeerLike
    }): Promise<number[]>
    // code in this file is very bad, thanks to Telegram's awesome updates mechanism
    /**
     * Enable RPS meter.
     * Only available in NodeJS v10.7.0 and newer
     *
     * > **Note**: This may have negative impact on performance
     *
     * **Available**: ✅ both users and bots
     *
     * @param size  Sampling size
     * @param time  Window time
     */
    enableRps(size?: number, time?: number): void
    /**
     * Get current average incoming RPS
     *
     * Incoming RPS is calculated based on
     * incoming update containers. Normally,
     * they should be around the same, except
     * rare situations when processing rps
     * may peak.
     * **Available**: ✅ both users and bots
     *
     */
    getCurrentRpsIncoming(): number
    /**
     * Get current average processing RPS
     *
     * Processing RPS is calculated based on
     * dispatched updates. Normally,
     * they should be around the same, except
     * rare situations when processing rps
     * may peak.
     * **Available**: ✅ both users and bots
     *
     */
    getCurrentRpsProcessing(): number
    /**
     * Start updates loop.
     *
     * You must first call {@link enableUpdatesProcessing} to use this method.
     *
     * It is recommended to use this method in callback to {@link start},
     * or otherwise make sure the user is logged in.
     *
     * > **Note**: If you are using {@link UpdatesManagerParams.catchUp} option,
     * > catching up will be done in background, you can't await it.
     * **Available**: ✅ both users and bots
     *
     */
    startUpdatesLoop(): Promise<void>
    /**
     * **ADVANCED**
     *
     * Manually stop updates loop.
     * Usually done automatically when stopping the client with {@link close}
     * **Available**: ✅ both users and bots
     *
     */
    stopUpdatesLoop(): void
    /**
     * Catch up with the server by loading missed updates.
     *
     * > **Note**: In case the storage was not properly
     * > closed the last time, "catching up" might
     * > result in duplicate updates.
     * **Available**: ✅ both users and bots
     *
     */
    catchUp(): void
    /**
     * Block a user
     *
     * **Available**: 👤 users only
     *
     * @param id  User ID, username or phone number
     */
    blockUser(id: InputPeerLike): Promise<void>
    /**
     * Delete your own profile photos
     *
     * **Available**: 👤 users only
     *
     * @param ids  ID(s) of the photos. Can be file IDs or raw TL objects
     */
    deleteProfilePhotos(ids: MaybeArray<string | tl.TypeInputPhoto>): Promise<void>
    /**
     * Edit "close friends" list directly using user IDs
     *
     * **Available**: ✅ both users and bots
     *
     * @param ids  User IDs
     */
    editCloseFriendsRaw(ids: number[]): Promise<void>
    /**
     * Edit "close friends" list using `InputPeerLike`s
     *
     * **Available**: ✅ both users and bots
     *
     * @param ids  User IDs
     */
    editCloseFriends(ids: InputPeerLike[]): Promise<void>
    /**
     * Get a list of common chats you have with a given user
     *
     * **Available**: 👤 users only
     *
     * @param userId  User's ID, username or phone number
     * @throws MtInvalidPeerTypeError
     */
    getCommonChats(userId: InputPeerLike): Promise<Chat[]>
    /**
     * Gets the current default value of the Time-To-Live setting, applied to all new chats.
     * **Available**: ✅ both users and bots
     *
     */
    getGlobalTtl(): Promise<number>
    /**
     * Get currently authorized user's full information
     * **Available**: ✅ both users and bots
     *
     */
    getMe(): Promise<User>
    /**
     * Get currently authorized user's username.
     *
     * This method uses locally available information and
     * does not call any API methods.
     * **Available**: ✅ both users and bots
     *
     */
    getMyUsername(): string | null
    /**
     * Get a single profile picture of a user by its ID
     *
     * **Available**: ✅ both users and bots
     *
     * @param userId  User ID, username, phone number, `"me"` or `"self"`
     * @param photoId  ID of the photo to fetch
     * @param params
     */
    getProfilePhoto(userId: InputPeerLike, photoId: tl.Long): Promise<Photo>
    /**
     * Get a list of profile pictures of a user
     *
     * **Available**: ✅ both users and bots
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
             * @default  `0`
             */
            offset?: number

            /**
             * Maximum number of items to fetch (up to 100)
             *
             * @default  `100`
             */
            limit?: number
        },
    ): Promise<ArrayPaginated<Photo, number>>
    /**
     * Get information about a single user.
     *
     * @param id  User's identifier. Can be ID, username, phone number, `"me"` or `"self"` or TL object
     */
    getUsers(id: InputPeerLike): Promise<User>
    /**
     * Get information about multiple users.
     * You can retrieve up to 200 users at once.
     *
     * Note that order is not guaranteed.
     *
     * @param ids  Users' identifiers. Can be ID, username, phone number, `"me"`, `"self"` or TL object
     */
    getUsers(ids: InputPeerLike[]): Promise<User[]>
    /**
     * Iterate over profile photos
     *
     * **Available**: ✅ both users and bots
     *
     * @param userId  User ID, username, phone number, `"me"` or `"self"`
     * @param params
     */
    iterProfilePhotos(
        userId: InputPeerLike,
        params?: Parameters<typeof getProfilePhotos>[2] & {
            /**
             * Maximum number of items to fetch
             *
             * @default  `Infinity`, i.e. all items are fetched
             */
            limit?: number

            /**
             * Size of chunks which are fetched. Usually not needed.
             *
             * @default  100
             */
            chunkSize?: number
        },
    ): AsyncIterableIterator<Photo>
    /**
     * Get multiple `InputPeer`s at once,
     * while also normalizing and removing
     * peers that can't be normalized to that type.
     *
     * Uses async pool internally, with a concurrent limit of 8
     *
     * @param peerIds  Peer Ids
     * @param normalizer  Normalization function
     */
    resolvePeerMany<T extends tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel>(
        peerIds: InputPeerLike[],
        normalizer: (obj: tl.TypeInputPeer) => T | null,
    ): Promise<T[]>
    /**
     * Get multiple `InputPeer`s at once.
     *
     * Uses async pool internally, with a concurrent limit of 8
     *
     * @param peerIds  Peer Ids
     */
    resolvePeerMany(peerIds: InputPeerLike[]): Promise<tl.TypeInputPeer[]>

    /**
     * Get the `InputPeer` of a known peer id.
     * Useful when an `InputPeer` is needed in Raw API.
     *
     * **Available**: ✅ both users and bots
     *
     * @param peerId  The peer identifier that you want to extract the `InputPeer` from.
     * @param [force=false]  Whether to force re-fetch the peer from the server
     */
    resolvePeer(peerId: InputPeerLike, force?: boolean): Promise<tl.TypeInputPeer>
    /**
     * Set an emoji status for the current user
     *
     * **Available**: 👤 users only
     *
     * @param emoji  Custom emoji ID or `null` to remove the emoji
     */
    setEmojiStatus(
        emoji: tl.Long | null,
        params?: {
            /**
             * Date when the emoji status should expire (only if `emoji` is not `null`)
             */
            until?: number | Date
        },
    ): Promise<void>
    /**
     * Changes the current default value of the Time-To-Live setting,
     * applied to all new chats.
     *
     * **Available**: ✅ both users and bots
     *
     * @param period  New TTL period, in seconds (or 0 to disable)
     */
    setGlobalTtl(period: number): Promise<void>
    /**
     * Change user status to offline or online
     *
     * **Available**: 👤 users only
     *
     * @param [offline=true]  Whether the user is currently offline
     */
    setOffline(offline?: boolean): Promise<void>
    /**
     * Set a new profile photo or video.
     *
     * You can also pass a file ID or an InputPhoto to re-use existing photo.
     * **Available**: ✅ both users and bots
     *
     */
    setProfilePhoto(params: {
        /** Media type (photo or video) */
        type: 'photo' | 'video'
        /** Input media file */
        media: InputFileLike | tl.TypeInputPhoto
        /** When `type = video`, timestamp in seconds which will be shown as a static preview. */
        previewSec?: number
    }): Promise<Photo>
    /**
     * Change username of the current user.
     *
     * Note that bots usernames must be changed through
     * bot support or re-created from scratch.
     *
     * **Available**: 👤 users only
     *
     * @param username  New username (5-32 chars, allowed chars: `a-zA-Z0-9_`), or `null` to remove
     */
    setUsername(username: string | null): Promise<User>
    /**
     * Unblock a user
     *
     * **Available**: 👤 users only
     *
     * @param id  User ID, username or phone number
     */
    unblockUser(id: InputPeerLike): Promise<void>
    /**
     * Update your profile details.
     *
     * Only pass fields that you want to change.
     *
     * **Available**: 👤 users only
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
}

export { TelegramClientOptions }

export class TelegramClient extends BaseTelegramClient {
    constructor(opts: TelegramClientOptions) {
        super(opts)

        if (!opts.disableUpdates) {
            enableUpdatesProcessing(this, {
                onUpdate: makeParsedUpdateHandler({
                    ...opts.updates,
                    onUpdate: (update) => {
                        Conversation.handleUpdate(this, update)
                        this.emit('update', update)
                        this.emit(update.name, update.data)
                    },
                    onRawUpdate: (update, peers) => {
                        this.emit('raw_update', update, peers)
                    },
                }),
            })

            this.start = async (params) => {
                const user = await start(this, params)
                await this.startUpdatesLoop()

                return user
            }
        } else {
            this.start = start.bind(null, this)
        }
    }
    getAuthState = getAuthState.bind(null, this)
    _onAuthorization = _onAuthorization.bind(null, this)
    checkPassword = checkPassword.bind(null, this)
    getPasswordHint = getPasswordHint.bind(null, this)
    logOut = logOut.bind(null, this)
    recoverPassword = recoverPassword.bind(null, this)
    resendCode = resendCode.bind(null, this)
    run = run.bind(null, this)
    sendCode = sendCode.bind(null, this)
    sendRecoveryCode = sendRecoveryCode.bind(null, this)
    signInBot = signInBot.bind(null, this)
    signIn = signIn.bind(null, this)
    startTest = startTest.bind(null, this)
    answerCallbackQuery = answerCallbackQuery.bind(null, this)
    answerInlineQuery = answerInlineQuery.bind(null, this)
    answerPreCheckoutQuery = answerPreCheckoutQuery.bind(null, this)
    deleteMyCommands = deleteMyCommands.bind(null, this)
    getBotInfo = getBotInfo.bind(null, this)
    getBotMenuButton = getBotMenuButton.bind(null, this)
    getCallbackAnswer = getCallbackAnswer.bind(null, this)
    getGameHighScores = getGameHighScores.bind(null, this)
    getInlineGameHighScores = getInlineGameHighScores.bind(null, this)
    getMyCommands = getMyCommands.bind(null, this)
    _normalizeCommandScope = _normalizeCommandScope.bind(null, this)
    setBotInfo = setBotInfo.bind(null, this)
    setBotMenuButton = setBotMenuButton.bind(null, this)
    setGameScore = setGameScore.bind(null, this)
    setInlineGameScore = setInlineGameScore.bind(null, this)
    setMyCommands = setMyCommands.bind(null, this)
    setMyDefaultRights = setMyDefaultRights.bind(null, this)
    addChatMembers = addChatMembers.bind(null, this)
    archiveChats = archiveChats.bind(null, this)
    banChatMember = banChatMember.bind(null, this)
    createChannel = createChannel.bind(null, this)
    createGroup = createGroup.bind(null, this)
    createSupergroup = createSupergroup.bind(null, this)
    deleteChannel = deleteChannel.bind(null, this)
    deleteSupergroup = deleteChannel.bind(null, this)
    deleteChatPhoto = deleteChatPhoto.bind(null, this)
    deleteGroup = deleteGroup.bind(null, this)
    deleteHistory = deleteHistory.bind(null, this)
    deleteUserHistory = deleteUserHistory.bind(null, this)
    editAdminRights = editAdminRights.bind(null, this)
    getChatEventLog = getChatEventLog.bind(null, this)
    getChatMember = getChatMember.bind(null, this)
    getChatMembers = getChatMembers.bind(null, this)
    getChatPreview = getChatPreview.bind(null, this)
    getChat = getChat.bind(null, this)
    getFullChat = getFullChat.bind(null, this)
    getNearbyChats = getNearbyChats.bind(null, this)
    iterChatEventLog = iterChatEventLog.bind(null, this)
    iterChatMembers = iterChatMembers.bind(null, this)
    joinChat = joinChat.bind(null, this)
    kickChatMember = kickChatMember.bind(null, this)
    leaveChat = leaveChat.bind(null, this)
    markChatUnread = markChatUnread.bind(null, this)
    reorderUsernames = reorderUsernames.bind(null, this)
    restrictChatMember = restrictChatMember.bind(null, this)
    saveDraft = saveDraft.bind(null, this)
    setChatDefaultPermissions = setChatDefaultPermissions.bind(null, this)
    setChatDescription = setChatDescription.bind(null, this)
    setChatPhoto = setChatPhoto.bind(null, this)
    setChatTitle = setChatTitle.bind(null, this)
    setChatTtl = setChatTtl.bind(null, this)
    setChatUsername = setChatUsername.bind(null, this)
    setSlowMode = setSlowMode.bind(null, this)
    toggleContentProtection = toggleContentProtection.bind(null, this)
    toggleFragmentUsername = toggleFragmentUsername.bind(null, this)
    toggleJoinRequests = toggleJoinRequests.bind(null, this)
    toggleJoinToSend = toggleJoinToSend.bind(null, this)
    unarchiveChats = unarchiveChats.bind(null, this)
    unbanChatMember = unbanChatMember.bind(null, this)
    unrestrictChatMember = unbanChatMember.bind(null, this)
    addContact = addContact.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    deleteContacts = deleteContacts.bind(null, this)
    getContacts = getContacts.bind(null, this)
    importContacts = importContacts.bind(null, this)
    createFolder = createFolder.bind(null, this)
    deleteFolder = deleteFolder.bind(null, this)
    editFolder = editFolder.bind(null, this)
    findFolder = findFolder.bind(null, this)
    getFolders = getFolders.bind(null, this)
    _normalizeInputFolder = _normalizeInputFolder.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    getPeerDialogs = getPeerDialogs.bind(null, this)
    iterDialogs = iterDialogs.bind(null, this)
    setFoldersOrder = setFoldersOrder.bind(null, this)
    downloadAsBuffer = downloadAsBuffer.bind(null, this)
    downloadToFile = downloadToFile.bind(null, this)
    downloadAsIterable = downloadAsIterable.bind(null, this)
    downloadAsStream = downloadAsStream.bind(null, this)
    _normalizeFileToDocument = _normalizeFileToDocument.bind(null, this)
    _normalizeInputFile = _normalizeInputFile.bind(null, this)
    _normalizeInputMedia = _normalizeInputMedia.bind(null, this)
    uploadFile = uploadFile.bind(null, this)
    uploadMedia = uploadMedia.bind(null, this)
    createForumTopic = createForumTopic.bind(null, this)
    deleteForumTopicHistory = deleteForumTopicHistory.bind(null, this)
    editForumTopic = editForumTopic.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    getForumTopicsById = getForumTopicsById.bind(null, this)
    getForumTopics = getForumTopics.bind(null, this)
    iterForumTopics = iterForumTopics.bind(null, this)
    reorderPinnedForumTopics = reorderPinnedForumTopics.bind(null, this)
    toggleForumTopicClosed = toggleForumTopicClosed.bind(null, this)
    toggleForumTopicPinned = toggleForumTopicPinned.bind(null, this)
    toggleForum = toggleForum.bind(null, this)
    toggleGeneralTopicHidden = toggleGeneralTopicHidden.bind(null, this)
    createInviteLink = createInviteLink.bind(null, this)
    editInviteLink = editInviteLink.bind(null, this)
    exportInviteLink = exportInviteLink.bind(null, this)
    getInviteLinkMembers = getInviteLinkMembers.bind(null, this)
    getInviteLink = getInviteLink.bind(null, this)
    getInviteLinks = getInviteLinks.bind(null, this)
    getPrimaryInviteLink = getPrimaryInviteLink.bind(null, this)
    hideAllJoinRequests = hideAllJoinRequests.bind(null, this)
    hideJoinRequest = hideJoinRequest.bind(null, this)
    iterInviteLinkMembers = iterInviteLinkMembers.bind(null, this)
    iterInviteLinks = iterInviteLinks.bind(null, this)
    revokeInviteLink = revokeInviteLink.bind(null, this)
    closePoll = closePoll.bind(null, this)
    deleteMessages = deleteMessages.bind(null, this)
    deleteScheduledMessages = deleteScheduledMessages.bind(null, this)
    editInlineMessage = editInlineMessage.bind(null, this)
    editMessage = editMessage.bind(null, this)
    _findMessageInUpdate = _findMessageInUpdate.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    forwardMessages = forwardMessages.bind(null, this)
    _getDiscussionMessage = _getDiscussionMessage.bind(null, this)
    getDiscussionMessage = getDiscussionMessage.bind(null, this)
    getHistory = getHistory.bind(null, this)
    getMessageGroup = getMessageGroup.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    getMessageReactions = getMessageReactions.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    getMessagesUnsafe = getMessagesUnsafe.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    getMessages = getMessages.bind(null, this)
    getReactionUsers = getReactionUsers.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    getScheduledMessages = getScheduledMessages.bind(null, this)
    iterHistory = iterHistory.bind(null, this)
    iterReactionUsers = iterReactionUsers.bind(null, this)
    iterSearchGlobal = iterSearchGlobal.bind(null, this)
    iterSearchMessages = iterSearchMessages.bind(null, this)
    _parseEntities = _parseEntities.bind(null, this)
    pinMessage = pinMessage.bind(null, this)
    readHistory = readHistory.bind(null, this)
    readReactions = readReactions.bind(null, this)
    searchGlobal = searchGlobal.bind(null, this)
    searchMessages = searchMessages.bind(null, this)
    sendCopy = sendCopy.bind(null, this)
    sendMediaGroup = sendMediaGroup.bind(null, this)
    sendMedia = sendMedia.bind(null, this)
    sendReaction = sendReaction.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    sendScheduled = sendScheduled.bind(null, this)
    sendText = sendText.bind(null, this)
    sendTyping = sendTyping.bind(null, this)
    sendVote = sendVote.bind(null, this)
    translateMessage = translateMessage.bind(null, this)
    translateText = translateText.bind(null, this)
    unpinAllMessages = unpinAllMessages.bind(null, this)
    unpinMessage = unpinMessage.bind(null, this)
    initTakeoutSession = initTakeoutSession.bind(null, this)
    _normalizePrivacyRules = _normalizePrivacyRules.bind(null, this)
    getParseModesState = getParseModesState.bind(null, this)
    registerParseMode = registerParseMode.bind(null, this)
    unregisterParseMode = unregisterParseMode.bind(null, this)
    getParseMode = getParseMode.bind(null, this)
    setDefaultParseMode = setDefaultParseMode.bind(null, this)
    changeCloudPassword = changeCloudPassword.bind(null, this)
    enableCloudPassword = enableCloudPassword.bind(null, this)
    verifyPasswordEmail = verifyPasswordEmail.bind(null, this)
    resendPasswordEmail = resendPasswordEmail.bind(null, this)
    cancelPasswordEmail = cancelPasswordEmail.bind(null, this)
    removeCloudPassword = removeCloudPassword.bind(null, this)
    addStickerToSet = addStickerToSet.bind(null, this)
    createStickerSet = createStickerSet.bind(null, this)
    deleteStickerFromSet = deleteStickerFromSet.bind(null, this)
    getCustomEmojis = getCustomEmojis.bind(null, this)
    getInstalledStickers = getInstalledStickers.bind(null, this)
    getStickerSet = getStickerSet.bind(null, this)
    moveStickerInSet = moveStickerInSet.bind(null, this)
    setChatStickerSet = setChatStickerSet.bind(null, this)
    setStickerSetThumb = setStickerSetThumb.bind(null, this)
    applyBoost = applyBoost.bind(null, this)
    canApplyBoost = canApplyBoost.bind(null, this)
    canSendStory = canSendStory.bind(null, this)
    deleteStories = deleteStories.bind(null, this)
    editStory = editStory.bind(null, this)
    _findStoryInUpdate = _findStoryInUpdate.bind(null, this)
    getAllStories = getAllStories.bind(null, this)
    getBoostStats = getBoostStats.bind(null, this)
    getBoosters = getBoosters.bind(null, this)
    getPeerStories = getPeerStories.bind(null, this)
    getProfileStories = getProfileStories.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    getStoriesById = getStoriesById.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    getStoriesInteractions = getStoriesInteractions.bind(null, this)
    getStoryLink = getStoryLink.bind(null, this)
    getStoryViewers = getStoryViewers.bind(null, this)
    hideMyStoriesViews = hideMyStoriesViews.bind(null, this)
    incrementStoriesViews = incrementStoriesViews.bind(null, this)
    iterAllStories = iterAllStories.bind(null, this)
    iterBoosters = iterBoosters.bind(null, this)
    iterProfileStories = iterProfileStories.bind(null, this)
    iterStoryViewers = iterStoryViewers.bind(null, this)
    readStories = readStories.bind(null, this)
    reportStory = reportStory.bind(null, this)
    sendStoryReaction = sendStoryReaction.bind(null, this)
    sendStory = sendStory.bind(null, this)
    togglePeerStoriesArchived = togglePeerStoriesArchived.bind(null, this)
    toggleStoriesPinned = toggleStoriesPinned.bind(null, this)
    enableRps = enableRps.bind(null, this)
    getCurrentRpsIncoming = getCurrentRpsIncoming.bind(null, this)
    getCurrentRpsProcessing = getCurrentRpsProcessing.bind(null, this)
    startUpdatesLoop = startUpdatesLoop.bind(null, this)
    stopUpdatesLoop = stopUpdatesLoop.bind(null, this)
    catchUp = catchUp.bind(null, this)
    blockUser = blockUser.bind(null, this)
    deleteProfilePhotos = deleteProfilePhotos.bind(null, this)
    editCloseFriendsRaw = editCloseFriendsRaw.bind(null, this)
    editCloseFriends = editCloseFriends.bind(null, this)
    getCommonChats = getCommonChats.bind(null, this)
    getGlobalTtl = getGlobalTtl.bind(null, this)
    getMe = getMe.bind(null, this)
    getMyUsername = getMyUsername.bind(null, this)
    getProfilePhoto = getProfilePhoto.bind(null, this)
    getProfilePhotos = getProfilePhotos.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    getUsers = getUsers.bind(null, this)
    iterProfilePhotos = iterProfilePhotos.bind(null, this)
    // @ts-expect-error .bind() kinda breaks typings for overloads
    resolvePeerMany = resolvePeerMany.bind(null, this)
    resolvePeer = resolvePeer.bind(null, this)
    setEmojiStatus = setEmojiStatus.bind(null, this)
    setGlobalTtl = setGlobalTtl.bind(null, this)
    setOffline = setOffline.bind(null, this)
    setProfilePhoto = setProfilePhoto.bind(null, this)
    setUsername = setUsername.bind(null, this)
    unblockUser = unblockUser.bind(null, this)
    updateProfile = updateProfile.bind(null, this)
}
