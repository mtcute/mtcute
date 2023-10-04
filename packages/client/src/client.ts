/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/unified-signatures */
/* THIS FILE WAS AUTO-GENERATED */
import { Readable } from 'stream'

import {
    BaseTelegramClient,
    BaseTelegramClientOptions,
    MaybeArray,
    MaybeAsync,
    PartialExcept,
    PartialOnly,
    tl,
} from '@mtcute/core'
import { AsyncLock, ConditionVariable, Deque, Logger, SortedLinkedList } from '@mtcute/core/utils'
import { tdFileId } from '@mtcute/file-id'

import { acceptTos } from './methods/auth/accept-tos'
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
import { signUp } from './methods/auth/sign-up'
import { start } from './methods/auth/start'
import { startTest } from './methods/auth/start-test'
import { answerCallbackQuery } from './methods/bots/answer-callback-query'
import { answerInlineQuery } from './methods/bots/answer-inline-query'
import { answerPreCheckoutQuery } from './methods/bots/answer-pre-checkout-query'
import { deleteMyCommands } from './methods/bots/delete-my-commands'
import { getBotMenuButton } from './methods/bots/get-bot-menu-button'
import { getCallbackAnswer } from './methods/bots/get-callback-answer'
import { getGameHighScores, getInlineGameHighScores } from './methods/bots/get-game-high-scores'
import { getMyCommands } from './methods/bots/get-my-commands'
import { _normalizeCommandScope } from './methods/bots/normalize-command-scope'
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
import { _pushConversationMessage } from './methods/dialogs/_init-conversation'
import { createFolder } from './methods/dialogs/create-folder'
import { deleteFolder } from './methods/dialogs/delete-folder'
import { editFolder } from './methods/dialogs/edit-folder'
import { findFolder } from './methods/dialogs/find-folder'
import { _normalizeInputFolder, getFolders } from './methods/dialogs/get-folders'
import { getPeerDialogs } from './methods/dialogs/get-peer-dialogs'
import { iterDialogs } from './methods/dialogs/iter-dialogs'
import { setFoldersOrder } from './methods/dialogs/set-folders'
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
import {
    getParseMode,
    registerParseMode,
    setDefaultParseMode,
    unregisterParseMode,
} from './methods/parse-modes/parse-modes'
import { changeCloudPassword } from './methods/pasword/change-cloud-password'
import { enableCloudPassword } from './methods/pasword/enable-cloud-password'
import { cancelPasswordEmail, resendPasswordEmail, verifyPasswordEmail } from './methods/pasword/password-email'
import { removeCloudPassword } from './methods/pasword/remove-cloud-password'
import { addStickerToSet } from './methods/stickers/add-sticker-to-set'
import { createStickerSet } from './methods/stickers/create-sticker-set'
import { deleteStickerFromSet } from './methods/stickers/delete-sticker-from-set'
import { getCustomEmojis } from './methods/stickers/get-custom-emojis'
import { getInstalledStickers } from './methods/stickers/get-installed-stickers'
import { getStickerSet } from './methods/stickers/get-sticker-set'
import { moveStickerInSet } from './methods/stickers/move-sticker-in-set'
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
import {
    _dispatchUpdate,
    _fetchUpdatesState,
    _handleUpdate,
    _keepAliveAction,
    _loadStorage,
    _onStop,
    _saveStorage,
    _updatesLoop,
    catchUp,
    enableRps,
    getCurrentRpsIncoming,
    getCurrentRpsProcessing,
    startUpdatesLoop,
    stopUpdatesLoop,
} from './methods/updates'
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
    Conversation,
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
    TermsOfService,
    TypingStatus,
    UploadedFile,
    UploadFileLike,
    User,
    UserStatusUpdate,
    UserTypingUpdate,
} from './types'
import { RpsMeter } from './utils/rps-meter'

// from methods/updates.ts
interface PendingUpdateContainer {
    upd: tl.TypeUpdates
    seqStart: number
    seqEnd: number
}
// from methods/updates.ts
interface PendingUpdate {
    update: tl.TypeUpdate
    channelId?: number
    pts?: number
    ptsBefore?: number
    qtsBefore?: number
    timeout?: number
    peers?: PeersIndex
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
     * @returns  On success, `true` is returned
     */
    logOut(): Promise<true>
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
     * @param params  Parameters to be passed to {@link TelegramClient.start}
     * @param then  Function to be called after {@link TelegramClient.start} returns
     */
    run(params: Parameters<TelegramClient['start']>[0], then?: (user: User) => void | Promise<void>): void
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
    signIn(phone: string, phoneCodeHash: string, phoneCode: string): Promise<User | TermsOfService | false>
    /**
     * Register a new user in Telegram.
     *
     * @param phone  Phone number in international format
     * @param phoneCodeHash  Code identifier from {@link TelegramClient.sendCode}
     * @param firstName  New user's first name
     * @param lastName  (default: `''`) New user's last name
     */
    signUp(phone: string, phoneCodeHash: string, firstName: string, lastName?: string): Promise<User>
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
         * Defaults to `console.log`.
         *
         * This method is called *before* {@link TelegramClient.start.params.code}.
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
        },
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
        },
    ): Promise<void>
    /**
     * Answer a pre-checkout query.
     *
     * @param queryId  Pre-checkout query ID
     * @param error  If pre-checkout is rejected, error message to show to the user
     */
    answerPreCheckoutQuery(queryId: tl.Long, error?: string): Promise<void>
    /**
     * Delete commands for the current bot and the given scope.
     *
     * Does the same as passing `null` to  {@link setMyCommands}
     *
     * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
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
     * Fetches the menu button set for the given user.
     *
     */
    getBotMenuButton(user: InputPeerLike): Promise<tl.TypeBotMenuButton>
    /**
     * Request a callback answer from a bot,
     * i.e. click an inline button that contains data.
     *
     * @param chatId  Chat ID where the message was found
     * @param message  ID of the message containing the button
     * @param data  Data contained in the button
     * @param params
     */
    getCallbackAnswer(
        chatId: InputPeerLike,
        message: number,
        data: string | Buffer,
        params?: {
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
             * If the button requires password entry,
             * your 2FA password.
             *
             * Your password is never exposed to the
             * bot, it is checked by Telegram.
             */
            password?: string
        },
    ): Promise<tl.messages.TypeBotCallbackAnswer>
    /**
     * Get high scores of a game
     *
     * @param chatId  ID of the chat where the game was found
     * @param message  ID of the message containing the game
     * @param userId  ID of the user to find high scores for
     */
    getGameHighScores(chatId: InputPeerLike, message: number, userId?: InputPeerLike): Promise<GameHighScore[]>
    /**
     * Get high scores of a game from an inline message
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
     * Sets a menu button for the given user.
     *
     */
    setBotMenuButton(user: InputPeerLike, button: tl.TypeBotMenuButton): Promise<void>
    /**
     * Set a score of a user in a game
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
     *
     * @param target  Whether to target groups or channels.
     * @param rights  The default chat permissions.
     */
    setMyDefaultRights(target: 'channel' | 'group', rights: Omit<tl.RawChatAdminRights, '_'>): Promise<void>
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
    addChatMembers(chatId: InputPeerLike, users: MaybeArray<InputPeerLike>, forwardCount?: number): Promise<void>
    /**
     * Archive one or more chats
     *
     * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
     */
    archiveChats(chats: MaybeArray<InputPeerLike>): Promise<void>
    /**
     * Ban a user from a legacy group, a supergroup or a channel.
     * They will not be able to re-join the group on their own,
     * manual administrator's action is required.
     *
     * @param chatId  Chat ID
     * @param userId  User ID
     * @returns  Service message about removed user, if one was generated.
     */
    banChatMember(chatId: InputPeerLike, userId: InputPeerLike): Promise<Message | null>
    /**
     * Create a new broadcast channel
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
    deleteHistory(chat: InputPeerLike, mode?: 'delete' | 'clear' | 'revoke', maxId?: number): Promise<void>
    /**
     * Delete all messages of a user (or channel) in a supergroup
     *
     * @param chatId  Chat ID
     * @param participantId  User/channel ID
     */
    deleteUserHistory(chatId: InputPeerLike, participantId: InputPeerLike): Promise<void>
    /**
     * Edit supergroup/channel admin rights of a user.
     *
     * @param chatId  Chat ID
     * @param userId  User ID
     * @param rights  New admin rights
     * @param rank  (default: `''`) Custom admin rank
     */
    editAdminRights(
        chatId: InputPeerLike,
        userId: InputPeerLike,
        rights: Omit<tl.RawChatAdminRights, '_'>,
        rank?: string,
    ): Promise<void>
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
     * @param chatId  Chat ID or username
     * @param userId  User ID, username, phone number, `"me"` or `"self"`
     * @throws UserNotParticipantError  In case given user is not a participant of a given chat
     */
    getChatMember(chatId: InputPeerLike, userId: InputPeerLike): Promise<ChatMember>
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
     * @param inviteLink  Invite link
     * @throws MtArgumentError  In case invite link has invalid format
     * @throws MtNotFoundError
     *   In case you are trying to get info about private chat that you have already joined.
     *   Use {@link getChat} or {@link getFullChat} instead.
     */
    getChatPreview(inviteLink: string): Promise<ChatPreview>
    /**
     * Get basic information about a chat.
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
     * @param chatId  ID of the chat, its username or invite link
     * @throws MtArgumentError
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
     * Iterate over chat event log.
     *
     * Small wrapper over {@link getChatEventLog}
     *
     * @param chatId  Chat ID
     * @param params
     */
    iterChatEventLog(
        chatId: InputPeerLike,
        params?: Parameters<TelegramClient['getChatEventLog']>[1] & {
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
     * @param chatId  Chat ID or username
     * @param params  Additional parameters
     */
    iterChatMembers(
        chatId: InputPeerLike,
        params?: Parameters<TelegramClient['getChatMembers']>[1] & {
            /**
             * Chunk size, which will be passed as `limit` parameter
             * to {@link TelegramClient.getChatMembers}. Usually you shouldn't care about this.
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
     * @param chatId
     *   Chat identifier. Either an invite link (`t.me/joinchat/*`), a username (`@username`)
     *   or ID of the linked supergroup or channel.
     */
    joinChat(chatId: InputPeerLike): Promise<Chat>
    /**
     * Kick a user from a chat.
     *
     * This effectively bans a user and immediately unbans them.
     *
     * @param chatId  Chat ID
     * @param userId  User ID
     */
    kickChatMember(chatId: InputPeerLike, userId: InputPeerLike): Promise<void>
    /**
     * Leave a group chat, supergroup or channel
     *
     * @param chatId  Chat ID or username
     * @param clear  (default: `false`) Whether to clear history after leaving (only for legacy group chats)
     */
    leaveChat(chatId: InputPeerLike, clear?: boolean): Promise<void>
    /**
     * Mark a chat as unread
     *
     * @param chatId  Chat ID
     */
    markChatUnread(chatId: InputPeerLike): Promise<void>
    /**
     * Reorder usernames
     *
     * @param peerId  Bot, channel or "me"/"self"
     */
    reorderUsernames(peerId: InputPeerLike, order: string[]): Promise<void>
    /**
     * Restrict a user in a supergroup.
     *
     * @param chatId  Chat ID
     * @param userId  User ID
     * @param restrictions
     *     Restrictions for the user. Note that unlike Bot API, this object contains
     *     the restrictions, and not the permissions, i.e. to
     *     passing `sendMessages=true` will disallow the user to send messages,
     *     and passing `{}` (empty object) will lift any restrictions
     * @param until
     *     Date when the user will be unrestricted.
     *     When `number` is passed, UNIX time in ms is expected.
     *     If this value is less than 30 seconds or more than 366 days in
     *     the future, user will be restricted forever. Defaults to `0` (forever)
     */
    restrictChatMember(
        chatId: InputPeerLike,
        userId: InputPeerLike,
        restrictions: Omit<tl.RawChatBannedRights, '_' | 'untilDate'>,
        until?: number | Date,
    ): Promise<void>
    /**
     * Save or delete a draft message associated with some chat
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
     * @param chatId  Chat ID or username
     * @param restrictions
     *     Restrictions for the chat. Note that unlike Bot API, this object contains
     *     the restrictions, and not the permissions, i.e. to
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
     * @param chatId  Chat ID or username
     * @param description  New chat description, 0-255 characters
     */
    setChatDescription(chatId: InputPeerLike, description: string): Promise<void>
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
        previewSec?: number,
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
     * Set maximum Time-To-Live of all newly sent messages in the specified chat
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
     * @param chatId  Chat ID or current username
     * @param username  New username, or `null` to remove
     */
    setChatUsername(chatId: InputPeerLike, username: string | null): Promise<void>
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
     * Set whether a chat has content protection (i.e. forwarding messages is disabled)
     *
     * @param chatId  Chat ID or username
     * @param enabled  (default: `false`) Whether content protection should be enabled
     */
    toggleContentProtection(chatId: InputPeerLike, enabled?: boolean): Promise<void>
    /**
     * Toggle a collectible (Fragment) username
     *
     * > **Note**: non-collectible usernames must still be changed
     * > using {@link setUsername}/{@link setChatUsername}
     *
     * @param peerId  Bot, channel or "me"/"self"
     */
    toggleFragmentUsername(
        peerId: InputPeerLike,
        params: {
            /**
             * Username to toggle
             */
            username: string

            /**
             * Whether to enable or disable the username
             */
            active: boolean
        },
    ): Promise<void>
    /**
     * Set whether a channel/supergroup has join requests enabled.
     *
     * > **Note**: this method only affects primary invite links.
     * > Additional invite links may exist with the opposite setting.
     *
     * @param chatId  Chat ID or username
     * @param enabled  (default: `false`) Whether join requests should be enabled
     */
    toggleJoinRequests(chatId: InputPeerLike, enabled?: boolean): Promise<void>
    /**
     * Set whether a channel/supergroup has join-to-send setting enabled.
     *
     * This only affects discussion groups where users can send messages
     * without joining the group.
     *
     * @param chatId  Chat ID or username
     * @param enabled  (default: `false`) Whether join-to-send setting should be enabled
     */
    toggleJoinToSend(chatId: InputPeerLike, enabled?: boolean): Promise<void>
    /**
     * Unarchive one or more chats
     *
     * @param chats  Chat ID(s), username(s), phone number(s), `"me"` or `"self"`
     */
    unarchiveChats(chats: MaybeArray<InputPeerLike>): Promise<void>

    /**
     * Unban a user from a supergroup or a channel,
     * or remove any restrictions that they have.
     * Unbanning does not add the user back to the chat, this
     * just allows the user to join the chat again, if they want.
     *
     * This method acts as a no-op in case a legacy group is passed.
     *
     * @param chatId  Chat ID
     * @param userId  User ID
     */
    unbanChatMember(chatId: InputPeerLike, userId: InputPeerLike): Promise<void>

    /**
     * Unban a user from a supergroup or a channel,
     * or remove any restrictions that they have.
     * Unbanning does not add the user back to the chat, this
     * just allows the user to join the chat again, if they want.
     *
     * This method acts as a no-op in case a legacy group is passed.
     *
     * @param chatId  Chat ID
     * @param userId  User ID
     */
    unrestrictChatMember(chatId: InputPeerLike, userId: InputPeerLike): Promise<void>
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
        },
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
        contacts: PartialOnly<Omit<tl.RawInputPhoneContact, '_'>, 'clientId'>[],
    ): Promise<tl.contacts.RawImportedContacts>

    _pushConversationMessage(msg: Message, incoming?: boolean): void
    /**
     * Create a folder from given parameters
     *
     * ID for the folder is optional, if not
     * provided it will be derived automatically.
     *
     * @param folder  Parameters for the folder
     * @returns  Newly created folder
     */
    createFolder(folder: PartialExcept<tl.RawDialogFilter, 'title'>): Promise<tl.RawDialogFilter>
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
        modification: Partial<Omit<tl.RawDialogFilter, 'id' | '_'>>,
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
    findFolder(params: { title?: string; emoji?: string; id?: number }): Promise<tl.RawDialogFilter | null>
    /**
     * Get list of folders.
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
     * Order is folder's ID (0 = default folder)
     *
     */
    setFoldersOrder(order: number[]): Promise<void>
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
    downloadToFile(filename: string, params: FileDownloadParameters): Promise<void>
    /**
     * Download a file and return it as an iterable, which yields file contents
     * in chunks of a given size. Order of the chunks is guaranteed to be
     * consecutive.
     *
     * @param params  Download parameters
     */
    downloadAsIterable(params: FileDownloadParameters): AsyncIterableIterator<Buffer>
    /**
     * Download a file and return it as a Node readable stream,
     * streaming file contents.
     *
     * @param params  File download parameters
     */
    downloadAsStream(params: FileDownloadParameters): Readable
    _normalizeFileToDocument(
        file: InputFileLike | tl.TypeInputDocument,
        params: {
            progressCallback?: (uploaded: number, total: number) => void
        },
    ): Promise<tl.TypeInputDocument>
    /**
     * Normalize a {@link InputFileLike} to `InputFile`,
     * uploading it if needed.
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
     * @param media  Media to upload
     * @param params  (default: `{}`) Upload parameters
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
     * @param chatId  Chat ID or username
     * @returns  Service message for the created topic
     */
    createForumTopic(
        chatId: InputPeerLike,
        params: {
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
        },
    ): Promise<Message>
    /**
     * Delete a forum topic and all its history
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
     * @param chatId  Chat ID or username
     * @param topicId  ID of the topic (i.e. its top message ID)
     * @returns  Service message about the modification
     */
    editForumTopic(
        chatId: InputPeerLike,
        topicId: number,
        params: {
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
        },
    ): Promise<Message>
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
     * @param chatId  Chat ID or username
     */
    iterForumTopics(
        chatId: InputPeerLike,
        params?: Parameters<TelegramClient['getForumTopics']>[1] & {
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
     *
     * @param chatId  Chat ID or username
     * @param topicId  ID of the topic (i.e. its top message ID)
     */
    reorderPinnedForumTopics(
        chatId: InputPeerLike,
        params: {
            /**
             * Order of the pinned topics
             */
            order: number[]

            /**
             * Whether to un-pin topics not present in the order
             */
            force?: boolean
        },
    ): Promise<void>
    /**
     * Toggle open/close status of a topic in a forum
     *
     * Only admins with `manageTopics` permission can do this.
     *
     * @param chatId  Chat ID or username
     * @param topicId  ID of the topic (i.e. its top message ID)
     * @param closed  Whether the topic should be closed
     * @returns  Service message about the modification
     */
    toggleForumTopicClosed(chatId: InputPeerLike, topicId: number, closed: boolean): Promise<Message>
    /**
     * Toggle whether a topic in a forum is pinned
     *
     * Only admins with `manageTopics` permission can do this.
     *
     * @param chatId  Chat ID or username
     * @param topicId  ID of the topic (i.e. its top message ID)
     * @param pinned  Whether the topic should be pinned
     */
    toggleForumTopicPinned(chatId: InputPeerLike, topicId: number, pinned: boolean): Promise<void>
    /**
     * Set whether a supergroup is a forum.
     *
     * Only owner of the supergroup can change this setting.
     *
     * @param chatId  Chat ID or username
     * @param enabled  (default: `false`) Whether the supergroup should be a forum
     */
    toggleForum(chatId: InputPeerLike, enabled?: boolean): Promise<void>
    /**
     * Toggle whether "General" topic in a forum is hidden or not
     *
     * Only admins with `manageTopics` permission can do this.
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

            /**
             * Whether users to be joined via this link need to be
             * approved by an admin
             */
            withApproval?: boolean
        },
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
     * @param params  Additional params
     */
    getInviteLinkMembers(
        chatId: InputPeerLike,
        params: {
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
     * @param chatId  Chat ID
     */
    getPrimaryInviteLink(chatId: InputPeerLike): Promise<ChatInviteLink>
    /**
     * Approve or deny multiple join requests to a chat.
     *
     * @param peer  Chat/channel ID
     * @param action  Whether to approve or deny the join requests
     * @param link  Invite link to target
     */
    hideAllJoinRequests(peer: InputPeerLike, action: 'approve' | 'deny', link?: string): Promise<void>
    /**
     * Approve or deny join request to a chat.
     *
     * @param peer  Chat/channel ID
     * @param user  User ID
     * @param action  Whether to approve or deny the join request
     */
    hideJoinRequest(peer: InputPeerLike, user: InputPeerLike, action: 'approve' | 'deny'): Promise<void>
    /**
     * Iterate over users who have joined
     * the chat with the given invite link.
     *
     * @param chatId  Chat ID
     * @param params  Additional params
     */
    iterInviteLinkMembers(
        chatId: InputPeerLike,
        params: Parameters<TelegramClient['getInviteLinkMembers']>[1] & {
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
     * @param chatId  Chat ID
     * @param adminId  Admin who created the links
     * @param params
     */
    iterInviteLinks(
        chatId: InputPeerLike,
        params?: Parameters<TelegramClient['getInviteLinks']>[1] & {
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
     * @param revoke  (default: `true`) Whether to "revoke" (i.e. delete for both sides).
     *      Only used for chats and private chats.
     */
    deleteMessages(chatId: InputPeerLike, ids: MaybeArray<number>, revoke?: boolean): Promise<void>
    /**
     * Delete scheduled messages.
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param ids  Message(s) ID(s) to delete.
     */
    deleteScheduledMessages(chatId: InputPeerLike, ids: MaybeArray<number>): Promise<void>
    /**
     * Edit sent inline message text, media and reply markup.
     *
     * @param messageId
     *     Inline message ID, either as a TL object, or as a
     *     TDLib and Bot API compatible string
     * @param params
     */
    editInlineMessage(
        messageId: tl.TypeInputBotInlineMessageID | string,
        params: {
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
        },
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
        },
    ): Promise<Message>

    _findMessageInUpdate(res: tl.TypeUpdates, isEdit?: boolean): Message
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
        },
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
        },
    ): Promise<MaybeArray<Message>>

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
     * @param peer  Channel where the post was found
     * @param message  ID of the channel post
     */
    getDiscussionMessage(peer: InputPeerLike, message: number): Promise<Message | null>
    /**
     * Get chat history.
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
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param params  Additional fetch parameters
     */
    iterHistory(
        chatId: InputPeerLike,
        params?: Parameters<TelegramClient['getHistory']>[1] & {
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
     * @param chatId  Chat ID
     * @param messageId  Message ID
     * @param params
     */
    iterReactionUsers(
        chatId: InputPeerLike,
        messageId: number,
        params?: Parameters<TelegramClient['getReactionUsers']>[2] & {
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
     * @param params  Search parameters
     */
    iterSearchGlobal(
        params?: Parameters<TelegramClient['searchGlobal']>[0] & {
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
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param params  Additional search parameters
     */
    iterSearchMessages(
        params?: Parameters<TelegramClient['searchMessages']>[0] & {
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
     * @param chatId  Chat ID, username, phone number, `"self"` or `"me"`
     * @param messageId  Message ID
     * @param notify  (default: `false`) Whether to send a notification (only for legacy groups and supergroups)
     * @param bothSides  (default: `false`) Whether to pin for both sides (only for private chats)
     */
    pinMessage(chatId: InputPeerLike, messageId: number, notify?: boolean, bothSides?: boolean): Promise<void>
    /**
     * Mark chat history as read.
     *
     * @param chatId  Chat ID
     * @param message  (default: `0`) Message up until which to read history (by default everything is read)
     * @param clearMentions  (default: `false`) Whether to also clear all mentions in the chat
     */
    readHistory(chatId: InputPeerLike, message?: number, clearMentions?: boolean): Promise<void>
    /**
     * Mark all reactions in chat as read.
     *
     * @param chatId  Chat ID
     */
    readReactions(chatId: InputPeerLike): Promise<void>
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
        },
    ): Promise<Message>
    /**
     * Send a group of media.
     *
     * To add a caption to the group, add caption to the first
     * media in the group and don't add caption for any other.
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
     * @param chatId  Chat ID with the message to react to
     * @param message  Message ID to react to
     * @param emoji  Reaction emoji (or `null` to remove reaction)
     * @param big  (default: `false`) Whether to use a big reaction
     * @returns  Message to which the reaction was sent
     */
    sendReaction(chatId: InputPeerLike, message: number, emoji?: InputReaction | null, big?: boolean): Promise<Message>
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
     * @param chatId  Chat ID
     * @param status  (default: `'typing'`) Typing status
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
     *
     * @param chatId  Chat ID where this poll was found
     * @param message  Message ID where this poll was found
     * @param options
     *     Selected options, or `null` to retract.
     *     You can pass indexes of the answers or the `Buffer`s
     *     representing them. In case of indexes, the poll will first
     *     be requested from the server.
     */
    sendVote(chatId: InputPeerLike, message: number, options: null | MaybeArray<number | Buffer>): Promise<Poll>
    /**
     * Translate message text to a given language.
     *
     * Returns `null` if it could not translate the message.
     *
     * > **Note**: For now doesn't seem to work, returns null for all messages.
     *
     * @param chatId  Chat or user ID
     * @param messageId  Identifier of the message to translate
     * @param toLanguage  Target language (two-letter ISO 639-1 language code)
     */
    translateMessage(
        chatId: InputPeerLike,
        messageId: number,
        toLanguage: string,
    ): Promise<[string, MessageEntity[]] | null>
    /**
     * Translate text to a given language.
     *
     * Returns `null` if it could not translate the message.
     *
     * > **Note**: For now doesn't seem to work, returns null for all messages.
     *
     * @param text  Text to translate
     * @param toLanguage  Target language (two-letter ISO 639-1 language code)
     */
    translateText(text: string, toLanguage: string): Promise<string | null>
    /**
     * Unpin all pinned messages in a chat.
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
     * @param chatId  Chat ID, username, phone number, `"self"` or `"me"`
     * @param messageId  Message ID
     */
    unpinMessage(chatId: InputPeerLike, messageId: number): Promise<void>
    /**
     * Create a new takeout session
     *
     * @param params  Takeout session parameters
     */
    initTakeoutSession(params: Omit<tl.account.RawInitTakeoutSessionRequest, '_'>): Promise<TakeoutSession>
    /**
     * Normalize {@link InputPrivacyRule}[] to `tl.TypeInputPrivacyRule`,
     * resolving the peers if needed.
     *
     */
    _normalizePrivacyRules(rules: InputPrivacyRule[]): Promise<tl.TypeInputPrivacyRule[]>
    /**
     * Register a given {@link IMessageEntityParser} as a parse mode
     * for messages. When this method is first called, given parse
     * mode is also set as default.
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
     * @param name  Name of the parse mode to unregister
     */
    unregisterParseMode(name: string): void
    /**
     * Get a {@link IMessageEntityParser} registered under a given name (or a default one).
     *
     * @param name  Name of the parse mode which parser to get.
     * @throws MtClientError  When the provided parse mode is not registered
     * @throws MtClientError  When `name` is omitted and there is no default parse mode
     */
    getParseMode(name?: string | null): IMessageEntityParser
    /**
     * Set a given parse mode as a default one.
     *
     * @param name  Name of the parse mode
     * @throws MtClientError  When given parse mode is not registered.
     */
    setDefaultParseMode(name: string): void
    /**
     * Change your 2FA password
     *
     * @param currentPassword  Current password as plaintext
     * @param newPassword  New password as plaintext
     * @param hint  Hint for the new password
     */
    changeCloudPassword(currentPassword: string, newPassword: string, hint?: string): Promise<void>
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
    enableCloudPassword(password: string, hint?: string, email?: string): Promise<void>
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
        },
    ): Promise<StickerSet>
    /**
     * Create a new sticker set.
     *
     * This is the only sticker-related method that
     * users can use (they allowed it with the "import stickers" update)
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
     *
     */
    getInstalledStickers(): Promise<StickerSet[]>
    /**
     * Get a sticker pack and stickers inside of it.
     *
     * @param id  Sticker pack short name, dice emoji, `"emoji"` for animated emojis or input ID
     */
    getStickerSet(id: string | { dice: string } | tl.TypeInputStickerSet): Promise<StickerSet>
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
        sticker: string | tdFileId.RawFullRemoteFileLocation | tl.TypeInputDocument,
        position: number,
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
        },
    ): Promise<StickerSet>
    /**
     * Boost a given channel
     *
     * @param peerId  Peer ID to boost
     */
    applyBoost(peerId: InputPeerLike): Promise<void>
    /**
     * Check if the current user can apply boost to a given channel
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
     * @returns  IDs of stories that were removed
     */
    getBoostStats(peerId: InputPeerLike): Promise<BoostStats>
    /**
     * Get boosters of a channel
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
     * @param peerId  Peer ID whose stories to fetch
     */
    getPeerStories(peerId: InputPeerLike): Promise<PeerStories>
    /**
     * Get profile stories
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
     *
     */
    getStoriesInteractions(peerId: InputPeerLike, storyId: number): Promise<StoryInteractions>
    /**
     * Get brief information about stories interactions.
     *
     * The result will be in the same order as the input IDs
     *
     */
    getStoriesInteractions(peerId: InputPeerLike, storyIds: number[]): Promise<StoryInteractions[]>
    /**
     * Generate a link to a story.
     *
     * Basically the link format is `t.me/<username>/s/<story_id>`,
     * and if the user doesn't have a username, `USER_PUBLIC_MISSING` is thrown.
     *
     * I have no idea why is this an RPC call, but whatever
     *
     */
    getStoryLink(peerId: InputPeerLike, storyId: number): Promise<string>
    /**
     * Get viewers list of a story
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
     * @param peerId  Peer ID whose stories to mark as read
     * @param ids  ID(s) of the stories to increment views of (max 200)
     */
    incrementStoriesViews(peerId: InputPeerLike, ids: MaybeArray<number>): Promise<boolean>
    /**
     * Iterate over all stories (e.g. to load the top bar)
     *
     * Wrapper over {@link getAllStories}
     *
     */
    iterAllStories(params?: {
        /**
         * Offset from which to start fetching stories
         */
        offset?: string

        /**
         * Maximum number of stories to fetch
         *
         * @default  Infinity
         */
        limit?: number

        /**
         * Whether to fetch stories from "archived" (or "hidden") peers
         */
        archived?: boolean
    }): AsyncIterableIterator<PeerStories>
    /**
     * Iterate over boosters of a channel.
     *
     * Wrapper over {@link getBoosters}
     *
     * @returns  IDs of stories that were removed
     */
    iterBoosters(
        peerId: InputPeerLike,
        params?: Parameters<TelegramClient['getBoosters']>[1] & {
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
     *
     */
    iterProfileStories(
        peerId: InputPeerLike,
        params?: Parameters<TelegramClient['getProfileStories']>[1] & {
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
     *
     */
    iterStoryViewers(
        peerId: InputPeerLike,
        storyId: number,
        params?: Parameters<TelegramClient['getStoryViewers']>[2] & {
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
     * @param peerId  Peer ID whose stories to mark as read
     * @returns  IDs of the stores that were marked as read
     */
    readStories(peerId: InputPeerLike, maxId: number): Promise<number[]>
    /**
     * Report a story (or multiple stories) to the moderation team
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
     *
     */
    sendStoryReaction(
        peerId: InputPeerLike,
        storyId: number,
        reaction: InputReaction,
        params?: {
            /**
             * Whether to add this reaction to recently used
             */
            addToRecent?: boolean
        },
    ): Promise<void>
    /**
     * Send a story
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
     *
     */
    togglePeerStoriesArchived(peerId: InputPeerLike, archived: boolean): Promise<void>
    /**
     * Toggle one or more stories pinned status
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
    /**
     * Enable RPS meter.
     * Only available in NodeJS v10.7.0 and newer
     *
     * > **Note**: This may have negative impact on performance
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
     *
     */
    getCurrentRpsProcessing(): number
    /**
     * Fetch updates state from the server.
     * Meant to be used right after authorization,
     * but before force-saving the session.
     */
    _fetchUpdatesState(): Promise<void>
    _loadStorage(): Promise<void>
    /**
     * **ADVANCED**
     *
     * Manually start updates loop.
     * Usually done automatically inside {@link start}
     */
    startUpdatesLoop(): void
    /**
     * **ADVANCED**
     *
     * Manually stop updates loop.
     * Usually done automatically when stopping the client with {@link close}
     */
    stopUpdatesLoop(): void

    _onStop(): void
    _saveStorage(afterImport?: boolean): Promise<void>
    _dispatchUpdate(update: tl.TypeUpdate | tl.TypeMessage, peers: PeersIndex): void
    _handleUpdate(update: tl.TypeUpdates, noDispatch?: boolean): void
    /**
     * Catch up with the server by loading missed updates.
     *
     */
    catchUp(): void
    // todo: updateChannelTooLong with catchUpChannels disabled should not trigger getDifference (?)
    // todo: when min peer or similar use pts_before as base pts for channels

    _updatesLoop(): Promise<void>

    _keepAliveAction(): void
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
    deleteProfilePhotos(ids: MaybeArray<string | tl.TypeInputPhoto>): Promise<void>
    /**
     * Edit "close friends" list directly using user IDs
     *
     * @param ids  User IDs
     */
    editCloseFriendsRaw(ids: number[]): Promise<void>
    /**
     * Edit "close friends" list using `InputPeerLike`s
     *
     * @param ids  User IDs
     */
    editCloseFriends(ids: InputPeerLike[]): Promise<void>
    /**
     * Get a list of common chats you have with a given user
     *
     * @param userId  User's ID, username or phone number
     * @throws MtInvalidPeerTypeError
     */
    getCommonChats(userId: InputPeerLike): Promise<Chat[]>
    /**
     * Gets the current default value of the Time-To-Live setting, applied to all new chats.
     *
     */
    getGlobalTtl(): Promise<number>
    /**
     * Get currently authorized user's full information
     *
     */
    getMe(): Promise<User>
    /**
     * Get currently authorized user's username.
     *
     * This method uses locally available information and
     * does not call any API methods.
     *
     */
    getMyUsername(): string | null
    /**
     * Get a single profile picture of a user by its ID
     *
     * @param userId  User ID, username, phone number, `"me"` or `"self"`
     * @param photoId  ID of the photo to fetch
     * @param params
     */
    getProfilePhoto(userId: InputPeerLike, photoId: tl.Long): Promise<Photo>
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
     * @param userId  User ID, username, phone number, `"me"` or `"self"`
     * @param params
     */
    iterProfilePhotos(
        userId: InputPeerLike,
        params?: Parameters<TelegramClient['getProfilePhotos']>[1] & {
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
     * Uses `async-eager-pool` internally, with a
     * limit of 10.
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
     * Uses `async-eager-pool` internally, with a
     * limit of 10.
     *
     * @param peerIds  Peer Ids
     */
    resolvePeerMany(peerIds: InputPeerLike[]): Promise<tl.TypeInputPeer[]>
    /**
     * Get the `InputPeer` of a known peer id.
     * Useful when an `InputPeer` is needed.
     *
     * @param peerId  The peer identifier that you want to extract the `InputPeer` from.
     * @param force  (default: `false`) Whether to force re-fetch the peer from the server
     */
    resolvePeer(peerId: InputPeerLike, force?: boolean): Promise<tl.TypeInputPeer>
    /**
     * Set an emoji status for the current user
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
     * @param period  New TTL period, in seconds (or 0 to disable)
     */
    setGlobalTtl(period: number): Promise<void>
    /**
     * Change user status to offline or online
     *
     * @param offline  (default: `true`) Whether the user is currently offline
     */
    setOffline(offline?: boolean): Promise<void>
    /**
     * Set a new profile photo or video.
     *
     * You can also pass a file ID or an InputPhoto to re-use existing photo.
     *
     * @param type  Media type (photo or video)
     * @param media  Input media file
     * @param previewSec
     *   When `type = video`, timestamp in seconds which will be shown
     *   as a static preview.
     */
    setProfilePhoto(
        type: 'photo' | 'video',
        media: InputFileLike | tl.TypeInputPhoto,
        previewSec?: number,
    ): Promise<Photo>
    /**
     * Change username of the current user.
     *
     * Note that bots usernames must be changed through
     * bot support or re-created from scratch.
     *
     * @param username  New username (5-32 chars, allowed chars: `a-zA-Z0-9_`), or `null` to remove
     */
    setUsername(username: string | null): Promise<User>
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
}

export class TelegramClient extends BaseTelegramClient {
    protected _userId: number | null
    protected _isBot: boolean
    protected _selfUsername: string | null
    protected _pendingConversations: Map<number, Conversation[]>
    protected _hasConversations: boolean
    protected _parseModes: Map<string, IMessageEntityParser>
    protected _defaultParseMode: string | null
    protected _updatesLoopActive: boolean
    protected _updatesLoopCv: ConditionVariable
    protected _pendingUpdateContainers: SortedLinkedList<PendingUpdateContainer>
    protected _pendingPtsUpdates: SortedLinkedList<PendingUpdate>
    protected _pendingPtsUpdatesPostponed: SortedLinkedList<PendingUpdate>
    protected _pendingQtsUpdates: SortedLinkedList<PendingUpdate>
    protected _pendingQtsUpdatesPostponed: SortedLinkedList<PendingUpdate>
    protected _pendingUnorderedUpdates: Deque<PendingUpdate>
    protected _updLock: AsyncLock
    protected _rpsIncoming?: RpsMeter
    protected _rpsProcessing?: RpsMeter
    protected _pts?: number
    protected _qts?: number
    protected _date?: number
    protected _seq?: number
    protected _oldPts?: number
    protected _oldQts?: number
    protected _oldDate?: number
    protected _oldSeq?: number
    protected _selfChanged: boolean
    protected _catchUpChannels?: boolean
    protected _cpts: Map<number, number>
    protected _cptsMod: Map<number, number>
    protected _updsLog: Logger
    constructor(opts: BaseTelegramClientOptions) {
        super(opts)
        this._userId = null
        this._isBot = false
        this._selfUsername = null
        this.log.prefix = '[USER N/A] '
        this._pendingConversations = new Map()
        this._hasConversations = false
        this._parseModes = new Map()
        this._defaultParseMode = null
        this._updatesLoopActive = false
        this._updatesLoopCv = new ConditionVariable()

        this._pendingUpdateContainers = new SortedLinkedList((a, b) => a.seqStart - b.seqStart)
        this._pendingPtsUpdates = new SortedLinkedList((a, b) => a.ptsBefore! - b.ptsBefore!)
        this._pendingPtsUpdatesPostponed = new SortedLinkedList((a, b) => a.ptsBefore! - b.ptsBefore!)
        this._pendingQtsUpdates = new SortedLinkedList((a, b) => a.qtsBefore! - b.qtsBefore!)
        this._pendingQtsUpdatesPostponed = new SortedLinkedList((a, b) => a.qtsBefore! - b.qtsBefore!)
        this._pendingUnorderedUpdates = new Deque()

        this._updLock = new AsyncLock()
        // we dont need to initialize state fields since
        // they are always loaded either from the server, or from storage.

        // channel PTS are not loaded immediately, and instead are cached here
        // after the first time they were retrieved from the storage.
        this._cpts = new Map()
        // modified channel pts, to avoid unnecessary
        // DB calls for not modified cpts
        this._cptsMod = new Map()

        this._selfChanged = false

        this._updsLog = this.log.create('updates')
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
    answerPreCheckoutQuery = answerPreCheckoutQuery
    deleteMyCommands = deleteMyCommands
    getBotMenuButton = getBotMenuButton
    getCallbackAnswer = getCallbackAnswer
    getGameHighScores = getGameHighScores
    getInlineGameHighScores = getInlineGameHighScores
    getMyCommands = getMyCommands
    _normalizeCommandScope = _normalizeCommandScope
    setBotMenuButton = setBotMenuButton
    setGameScore = setGameScore
    setInlineGameScore = setInlineGameScore
    setMyCommands = setMyCommands
    setMyDefaultRights = setMyDefaultRights
    addChatMembers = addChatMembers
    archiveChats = archiveChats
    banChatMember = banChatMember
    createChannel = createChannel
    createGroup = createGroup
    createSupergroup = createSupergroup
    deleteChannel = deleteChannel
    deleteSupergroup = deleteChannel
    deleteChatPhoto = deleteChatPhoto
    deleteGroup = deleteGroup
    deleteHistory = deleteHistory
    deleteUserHistory = deleteUserHistory
    editAdminRights = editAdminRights
    getChatEventLog = getChatEventLog
    getChatMember = getChatMember
    getChatMembers = getChatMembers
    getChatPreview = getChatPreview
    getChat = getChat
    getFullChat = getFullChat
    getNearbyChats = getNearbyChats
    iterChatEventLog = iterChatEventLog
    iterChatMembers = iterChatMembers
    joinChat = joinChat
    kickChatMember = kickChatMember
    leaveChat = leaveChat
    markChatUnread = markChatUnread
    reorderUsernames = reorderUsernames
    restrictChatMember = restrictChatMember
    saveDraft = saveDraft
    setChatDefaultPermissions = setChatDefaultPermissions
    setChatDescription = setChatDescription
    setChatPhoto = setChatPhoto
    setChatTitle = setChatTitle
    setChatTtl = setChatTtl
    setChatUsername = setChatUsername
    setSlowMode = setSlowMode
    toggleContentProtection = toggleContentProtection
    toggleFragmentUsername = toggleFragmentUsername
    toggleJoinRequests = toggleJoinRequests
    toggleJoinToSend = toggleJoinToSend
    unarchiveChats = unarchiveChats
    unbanChatMember = unbanChatMember
    unrestrictChatMember = unbanChatMember
    addContact = addContact
    deleteContacts = deleteContacts
    getContacts = getContacts
    importContacts = importContacts
    _pushConversationMessage = _pushConversationMessage
    createFolder = createFolder
    deleteFolder = deleteFolder
    editFolder = editFolder
    findFolder = findFolder
    getFolders = getFolders
    _normalizeInputFolder = _normalizeInputFolder
    getPeerDialogs = getPeerDialogs
    iterDialogs = iterDialogs
    setFoldersOrder = setFoldersOrder
    downloadAsBuffer = downloadAsBuffer
    downloadToFile = downloadToFile
    downloadAsIterable = downloadAsIterable
    downloadAsStream = downloadAsStream
    _normalizeFileToDocument = _normalizeFileToDocument
    _normalizeInputFile = _normalizeInputFile
    _normalizeInputMedia = _normalizeInputMedia
    uploadFile = uploadFile
    uploadMedia = uploadMedia
    createForumTopic = createForumTopic
    deleteForumTopicHistory = deleteForumTopicHistory
    editForumTopic = editForumTopic
    getForumTopicsById = getForumTopicsById
    getForumTopics = getForumTopics
    iterForumTopics = iterForumTopics
    reorderPinnedForumTopics = reorderPinnedForumTopics
    toggleForumTopicClosed = toggleForumTopicClosed
    toggleForumTopicPinned = toggleForumTopicPinned
    toggleForum = toggleForum
    toggleGeneralTopicHidden = toggleGeneralTopicHidden
    createInviteLink = createInviteLink
    editInviteLink = editInviteLink
    exportInviteLink = exportInviteLink
    getInviteLinkMembers = getInviteLinkMembers
    getInviteLink = getInviteLink
    getInviteLinks = getInviteLinks
    getPrimaryInviteLink = getPrimaryInviteLink
    hideAllJoinRequests = hideAllJoinRequests
    hideJoinRequest = hideJoinRequest
    iterInviteLinkMembers = iterInviteLinkMembers
    iterInviteLinks = iterInviteLinks
    revokeInviteLink = revokeInviteLink
    closePoll = closePoll
    deleteMessages = deleteMessages
    deleteScheduledMessages = deleteScheduledMessages
    editInlineMessage = editInlineMessage
    editMessage = editMessage
    _findMessageInUpdate = _findMessageInUpdate
    forwardMessages = forwardMessages
    _getDiscussionMessage = _getDiscussionMessage
    getDiscussionMessage = getDiscussionMessage
    getHistory = getHistory
    getMessageGroup = getMessageGroup
    getMessageReactions = getMessageReactions
    getMessagesUnsafe = getMessagesUnsafe
    getMessages = getMessages
    getReactionUsers = getReactionUsers
    getScheduledMessages = getScheduledMessages
    iterHistory = iterHistory
    iterReactionUsers = iterReactionUsers
    iterSearchGlobal = iterSearchGlobal
    iterSearchMessages = iterSearchMessages
    _parseEntities = _parseEntities
    pinMessage = pinMessage
    readHistory = readHistory
    readReactions = readReactions
    searchGlobal = searchGlobal
    searchMessages = searchMessages
    sendCopy = sendCopy
    sendMediaGroup = sendMediaGroup
    sendMedia = sendMedia
    sendReaction = sendReaction
    sendScheduled = sendScheduled
    sendText = sendText
    sendTyping = sendTyping
    sendVote = sendVote
    translateMessage = translateMessage
    translateText = translateText
    unpinAllMessages = unpinAllMessages
    unpinMessage = unpinMessage
    initTakeoutSession = initTakeoutSession
    _normalizePrivacyRules = _normalizePrivacyRules
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
    getCustomEmojis = getCustomEmojis
    getInstalledStickers = getInstalledStickers
    getStickerSet = getStickerSet
    moveStickerInSet = moveStickerInSet
    setStickerSetThumb = setStickerSetThumb
    applyBoost = applyBoost
    canApplyBoost = canApplyBoost
    canSendStory = canSendStory
    deleteStories = deleteStories
    editStory = editStory
    _findStoryInUpdate = _findStoryInUpdate
    getAllStories = getAllStories
    getBoostStats = getBoostStats
    getBoosters = getBoosters
    getPeerStories = getPeerStories
    getProfileStories = getProfileStories
    getStoriesById = getStoriesById
    getStoriesInteractions = getStoriesInteractions
    getStoryLink = getStoryLink
    getStoryViewers = getStoryViewers
    hideMyStoriesViews = hideMyStoriesViews
    incrementStoriesViews = incrementStoriesViews
    iterAllStories = iterAllStories
    iterBoosters = iterBoosters
    iterProfileStories = iterProfileStories
    iterStoryViewers = iterStoryViewers
    readStories = readStories
    reportStory = reportStory
    sendStoryReaction = sendStoryReaction
    sendStory = sendStory
    togglePeerStoriesArchived = togglePeerStoriesArchived
    toggleStoriesPinned = toggleStoriesPinned
    enableRps = enableRps
    getCurrentRpsIncoming = getCurrentRpsIncoming
    getCurrentRpsProcessing = getCurrentRpsProcessing
    _fetchUpdatesState = _fetchUpdatesState
    _loadStorage = _loadStorage
    startUpdatesLoop = startUpdatesLoop
    stopUpdatesLoop = stopUpdatesLoop
    _onStop = _onStop
    _saveStorage = _saveStorage
    _dispatchUpdate = _dispatchUpdate
    _handleUpdate = _handleUpdate
    catchUp = catchUp
    _updatesLoop = _updatesLoop
    _keepAliveAction = _keepAliveAction
    blockUser = blockUser
    deleteProfilePhotos = deleteProfilePhotos
    editCloseFriendsRaw = editCloseFriendsRaw
    editCloseFriends = editCloseFriends
    getCommonChats = getCommonChats
    getGlobalTtl = getGlobalTtl
    getMe = getMe
    getMyUsername = getMyUsername
    getProfilePhoto = getProfilePhoto
    getProfilePhotos = getProfilePhotos
    getUsers = getUsers
    iterProfilePhotos = iterProfilePhotos
    resolvePeerMany = resolvePeerMany
    resolvePeer = resolvePeer
    setEmojiStatus = setEmojiStatus
    setGlobalTtl = setGlobalTtl
    setOffline = setOffline
    setProfilePhoto = setProfilePhoto
    setUsername = setUsername
    unblockUser = unblockUser
    updateProfile = updateProfile
}
