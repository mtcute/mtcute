/* eslint-disable ts/no-unsafe-declaration-merging, ts/no-unsafe-argument */
import type { tdFileId } from '@mtcute/file-id'
import type { tl } from '@mtcute/tl'
import type Long from 'long'
import type { RpcCallOptions } from '../network/index.js'
import type { MaybeArray, MaybePromise, PartialExcept, PartialOnly } from '../types/index.js'
import type { BaseTelegramClientOptions } from './base.js'
import type { ITelegramClient } from './client.types.js'
import type { LogOutResult } from './methods/auth/log-out.js'
import type { CreateGroupResult } from './methods/chats/create-group.js'
import type { GetForumTopicsOffset } from './methods/forums/get-forum-topics.js'
import type { GetInviteLinksOffset } from './methods/invite-links/get-invite-links.js'
import type { DeleteMessagesParams } from './methods/messages/delete-messages.js'
import type { ForwardMessageOptions } from './methods/messages/forward-messages.js'
import type { GetHistoryOffset } from './methods/messages/get-history.js'
import type { GetReactionUsersOffset } from './methods/messages/get-reaction-users.js'
import type { SearchGlobalOffset } from './methods/messages/search-global.js'
import type { SearchHashtagOffset } from './methods/messages/search-hashtag.js'
import type { SearchMessagesOffset } from './methods/messages/search-messages.js'
import type { CommonSendParams } from './methods/messages/send-common.js'
import type { SendCopyGroupParams } from './methods/messages/send-copy-group.js'
import type { SendCopyParams } from './methods/messages/send-copy.js'
import type { QuoteParamsFrom } from './methods/messages/send-quote.js'
import type { CanApplyBoostResult } from './methods/premium/can-apply-boost.js'
import type { InputStarGiftAttributeIds, ResaleStarGiftsMeta } from './methods/premium/get-resale-star-gifts.js'
import type { CanSendStoryResult } from './methods/stories/can-send-story.js'
import type { ITelegramStorageProvider } from './storage/provider.js'
import type { AllStories, ArrayPaginated, ArrayPaginatedWithMeta, ArrayWithTotal, Boost, BoostSlot, BoostStats, BotChatJoinRequestUpdate, BotCommands, BotReactionCountUpdate, BotReactionUpdate, BotStoppedUpdate, BusinessCallbackQuery, BusinessChatLink, BusinessConnection, BusinessMessage, BusinessWorkHoursDay, CallbackQuery, Chat, ChatEvent, ChatInviteLink, ChatInviteLinkMember, ChatJoinRequestUpdate, ChatlistPreview, ChatMember, ChatMemberUpdate, ChatPreview, ChosenInlineResult, CollectibleInfo, DeleteBusinessMessageUpdate, DeleteMessageUpdate, DeleteStoryUpdate, Dialog, FactCheck, FileDownloadLocation, FileDownloadParameters, ForumTopic, FullChat, FullUser, GameHighScore, HistoryReadUpdate, InlineCallbackQuery, InlineQuery, InputChatEventFilters, InputDialogFolder, InputFileLike, InputInlineResult, InputMediaLike, InputMediaSticker, InputMessageId, InputPeerLike, InputPrivacyRule, InputReaction, InputStarGift, InputStickerSet, InputStickerSetItem, InputText, InputWebview, MaybeDynamic, Message, MessageEffect, MessageMedia, MessageReactions, ParametersSkip2, ParsedUpdate, Peer, PeerReaction, PeerSettings, PeerStories, Photo, Poll, PollUpdate, PollVoteUpdate, PreCheckoutQuery, RawDocument, ReplyMarkup, SavedStarGift, SentCode, StarGift, StarGiftUnique, StarsStatus, StarsTransaction, Sticker, StickerSet, StickerType, StoriesStealthMode, Story, StoryInteractions, StoryUpdate, StoryViewer, StoryViewersList, TakeoutSession, TextWithEntities, TypingStatus, UploadedFile, UploadFileLike, User, UserStatusUpdate, UserTypingUpdate, WebPageMedia, WebviewResult } from './types/index.js'
import type { ParsedUpdateHandlerParams } from './updates/parsed.js'
import type { RawUpdateInfo } from './updates/types.js'
import type { InputStringSessionData } from './utils/string-session.js'
/* THIS FILE WAS AUTO-GENERATED */
import { Emitter } from '@fuman/utils'
import { MtUnsupportedError } from '../types/index.js'
import { BaseTelegramClient } from './base.js'
import { checkPassword } from './methods/auth/check-password.js'
import { getPasswordHint } from './methods/auth/get-password-hint.js'
import { logOut } from './methods/auth/log-out.js'
import { recoverPassword } from './methods/auth/recover-password.js'
import { resendCode } from './methods/auth/resend-code.js'
import { run } from './methods/auth/run.js'
import { sendCode } from './methods/auth/send-code.js'
import { sendRecoveryCode } from './methods/auth/send-recovery-code.js'
import { signInBot } from './methods/auth/sign-in-bot.js'
import { signInQr } from './methods/auth/sign-in-qr.js'
import { signIn } from './methods/auth/sign-in.js'
import { startTest } from './methods/auth/start-test.js'
import { start } from './methods/auth/start.js'
import { isSelfPeer } from './methods/auth/utils.js'
import { answerCallbackQuery } from './methods/bots/answer-callback-query.js'
import { answerInlineQuery } from './methods/bots/answer-inline-query.js'
import { answerPreCheckoutQuery } from './methods/bots/answer-pre-checkout-query.js'
import { deleteMyCommands } from './methods/bots/delete-my-commands.js'
import { getBotInfo } from './methods/bots/get-bot-info.js'
import { getBotMenuButton } from './methods/bots/get-bot-menu-button.js'
import { getCallbackAnswer } from './methods/bots/get-callback-answer.js'
import { getGameHighScores, getInlineGameHighScores } from './methods/bots/get-game-high-scores.js'
import { getMyCommands } from './methods/bots/get-my-commands.js'
import { closeWebview, openWebview } from './methods/bots/open-webview.js'
import { prepareInlineMessage } from './methods/bots/prepare-inline-message.js'
import { setBotInfo } from './methods/bots/set-bot-info.js'
import { setBotMenuButton } from './methods/bots/set-bot-menu-button.js'
import { setGameScore, setInlineGameScore } from './methods/bots/set-game-score.js'
import { setMyCommands } from './methods/bots/set-my-commands.js'
import { setMyDefaultRights } from './methods/bots/set-my-default-rights.js'
import { toggleEmojiStatusPermission } from './methods/bots/toggle-emoji-status-permission.js'
import { addChatMembers } from './methods/chats/add-chat-members.js'
import { archiveChats } from './methods/chats/archive-chats.js'
import { banChatMember } from './methods/chats/ban-chat-member.js'
import { createChannel } from './methods/chats/create-channel.js'
import { createGroup } from './methods/chats/create-group.js'
import { createSupergroup } from './methods/chats/create-supergroup.js'
import { deleteChannel } from './methods/chats/delete-channel.js'
import { deleteChatPhoto } from './methods/chats/delete-chat-photo.js'
import { deleteGroup } from './methods/chats/delete-group.js'
import { deleteHistory } from './methods/chats/delete-history.js'
import { deleteUserHistory } from './methods/chats/delete-user-history.js'
import { editAdminRights } from './methods/chats/edit-admin-rights.js'
import { getChatEventLog } from './methods/chats/get-chat-event-log.js'
import { getChatMember } from './methods/chats/get-chat-member.js'
import { getChatMembers } from './methods/chats/get-chat-members.js'
import { getChatPreview } from './methods/chats/get-chat-preview.js'
import { getChat } from './methods/chats/get-chat.js'
import { getFullChat } from './methods/chats/get-full-chat.js'
import { getFullUser } from './methods/chats/get-full-user.js'
import { getMessageAuthor } from './methods/chats/get-message-author.js'
import { getNearbyChats } from './methods/chats/get-nearby-chats.js'
import { getPeer } from './methods/chats/get-peer.js'
import { getSimilarChannels } from './methods/chats/get-similar-channels.js'
import { getUser } from './methods/chats/get-user.js'
import { iterChatEventLog } from './methods/chats/iter-chat-event-log.js'
import { iterChatMembers } from './methods/chats/iter-chat-members.js'
import { joinChat } from './methods/chats/join-chat.js'
import { kickChatMember } from './methods/chats/kick-chat-member.js'
import { leaveChat } from './methods/chats/leave-chat.js'
import { markChatUnread } from './methods/chats/mark-chat-unread.js'
import { closeChat, openChat } from './methods/chats/open-chat.js'
import { reorderUsernames } from './methods/chats/reorder-usernames.js'
import { restrictChatMember } from './methods/chats/restrict-chat-member.js'
import { saveDraft } from './methods/chats/save-draft.js'
import { setChatColor } from './methods/chats/set-chat-color.js'
import { setChatDefaultPermissions } from './methods/chats/set-chat-default-permissions.js'
import { setChatDescription } from './methods/chats/set-chat-description.js'
import { setChatPhoto } from './methods/chats/set-chat-photo.js'
import { setChatTitle } from './methods/chats/set-chat-title.js'
import { setChatTtl } from './methods/chats/set-chat-ttl.js'
import { setChatUsername } from './methods/chats/set-chat-username.js'
import { setSlowMode } from './methods/chats/set-slow-mode.js'
import { toggleContentProtection } from './methods/chats/toggle-content-protection.js'
import { toggleFragmentUsername } from './methods/chats/toggle-fragment-username.js'
import { toggleJoinRequests } from './methods/chats/toggle-join-requests.js'
import { toggleJoinToSend } from './methods/chats/toggle-join-to-send.js'
import { unarchiveChats } from './methods/chats/unarchive-chats.js'
import { unbanChatMember } from './methods/chats/unban-chat-member.js'
import { addContact } from './methods/contacts/add-contact.js'
import { deleteContacts } from './methods/contacts/delete-contacts.js'
import { getContacts } from './methods/contacts/get-contacts.js'
import { importContacts } from './methods/contacts/import-contacts.js'
import { createFolder } from './methods/dialogs/create-folder.js'
import { deleteFolder } from './methods/dialogs/delete-folder.js'
import { editFolder } from './methods/dialogs/edit-folder.js'
import { findDialogs } from './methods/dialogs/find-dialogs.js'
import { findFolder } from './methods/dialogs/find-folder.js'
import { getChatlistPreview } from './methods/dialogs/get-chatlist-preview.js'
import { getFolders } from './methods/dialogs/get-folders.js'
import { getPeerDialogs } from './methods/dialogs/get-peer-dialogs.js'
import { iterDialogs } from './methods/dialogs/iter-dialogs.js'
import { joinChatlist } from './methods/dialogs/join-chatlist.js'
import { setFoldersOrder } from './methods/dialogs/set-folders-order.js'
import { downloadAsBuffer } from './methods/files/download-buffer.js'
import { downloadAsIterable } from './methods/files/download-iterable.js'
import { downloadAsStream } from './methods/files/download-stream.js'
import { _normalizeInputFile } from './methods/files/normalize-input-file.js'
import { _normalizeInputMedia } from './methods/files/normalize-input-media.js'
import { uploadFile } from './methods/files/upload-file.js'
import { uploadMedia } from './methods/files/upload-media.js'
import { createForumTopic } from './methods/forums/create-forum-topic.js'
import { deleteForumTopicHistory } from './methods/forums/delete-forum-topic-history.js'
import { editForumTopic } from './methods/forums/edit-forum-topic.js'
import { getForumTopicsById } from './methods/forums/get-forum-topics-by-id.js'
import { getForumTopics } from './methods/forums/get-forum-topics.js'
import { iterForumTopics } from './methods/forums/iter-forum-topics.js'
import { reorderPinnedForumTopics } from './methods/forums/reorder-pinned-forum-topics.js'
import { toggleForumTopicClosed } from './methods/forums/toggle-forum-topic-closed.js'
import { toggleForumTopicPinned } from './methods/forums/toggle-forum-topic-pinned.js'
import { toggleForum, updateForumSettings } from './methods/forums/toggle-forum.js'
import { toggleGeneralTopicHidden } from './methods/forums/toggle-general-topic-hidden.js'
import { createInviteLink } from './methods/invite-links/create-invite-link.js'
import { editInviteLink } from './methods/invite-links/edit-invite-link.js'
import { exportInviteLink } from './methods/invite-links/export-invite-link.js'
import { getInviteLinkMembers } from './methods/invite-links/get-invite-link-members.js'
import { getInviteLink } from './methods/invite-links/get-invite-link.js'
import { getInviteLinks } from './methods/invite-links/get-invite-links.js'
import { getPrimaryInviteLink } from './methods/invite-links/get-primary-invite-link.js'
import { hideAllJoinRequests } from './methods/invite-links/hide-all-join-requests.js'
import { hideJoinRequest } from './methods/invite-links/hide-join-request.js'
import { iterInviteLinkMembers } from './methods/invite-links/iter-invite-link-members.js'
import { iterInviteLinks } from './methods/invite-links/iter-invite-links.js'
import { revokeInviteLink } from './methods/invite-links/revoke-invite-link.js'
import { appendTodoList } from './methods/messages/append-todo-list.js'
import { closePoll } from './methods/messages/close-poll.js'
import { deleteMessages, deleteMessagesById } from './methods/messages/delete-messages.js'
import { deleteScheduledMessages } from './methods/messages/delete-scheduled-messages.js'
import { editInlineMessage } from './methods/messages/edit-inline-message.js'
import { editMessage } from './methods/messages/edit-message.js'
import { forwardMessages, forwardMessagesById } from './methods/messages/forward-messages.js'
import { getAllScheduledMessages } from './methods/messages/get-all-scheduled-messages.js'
import { getAvailableMessageEffects } from './methods/messages/get-available-effects.js'
import { getCallbackQueryMessage } from './methods/messages/get-callback-query-message.js'
import { getDiscussionMessage } from './methods/messages/get-discussion-message.js'
import { getFactCheck } from './methods/messages/get-fact-check.js'
import { getHistory } from './methods/messages/get-history.js'
import { getMessageByLink } from './methods/messages/get-message-by-link.js'
import { getMessageGroup } from './methods/messages/get-message-group.js'
import { getMessageReactions, getMessageReactionsById } from './methods/messages/get-message-reactions.js'
import { getMessagesUnsafe } from './methods/messages/get-messages-unsafe.js'
import { getMessages } from './methods/messages/get-messages.js'
import { getReactionUsers } from './methods/messages/get-reaction-users.js'
import { getReplyTo } from './methods/messages/get-reply-to.js'
import { getScheduledMessages } from './methods/messages/get-scheduled-messages.js'
import { getWebPagePreview } from './methods/messages/get-web-page-preview.js'
import { iterHistory } from './methods/messages/iter-history.js'
import { iterReactionUsers } from './methods/messages/iter-reaction-users.js'
import { iterSearchGlobal } from './methods/messages/iter-search-global.js'
import { iterSearchMessages } from './methods/messages/iter-search-messages.js'
import { pinMessage } from './methods/messages/pin-message.js'
import { readHistory } from './methods/messages/read-history.js'
import { readReactions } from './methods/messages/read-reactions.js'
import { searchGlobal } from './methods/messages/search-global.js'
import { iterSearchHashtag, searchHashtag } from './methods/messages/search-hashtag.js'
import { searchMessages } from './methods/messages/search-messages.js'
import { answerMedia, answerMediaGroup, answerText } from './methods/messages/send-answer.js'
import { commentMedia, commentMediaGroup, commentText } from './methods/messages/send-comment.js'
import { sendCopyGroup } from './methods/messages/send-copy-group.js'
import { sendCopy } from './methods/messages/send-copy.js'
import { sendMediaGroup } from './methods/messages/send-media-group.js'
import { sendMedia } from './methods/messages/send-media.js'
import { sendPaidReaction } from './methods/messages/send-paid-reaction.js'
import { quoteWithMedia, quoteWithMediaGroup, quoteWithText } from './methods/messages/send-quote.js'
import { sendReaction } from './methods/messages/send-reaction.js'
import { replyMedia, replyMediaGroup, replyText } from './methods/messages/send-reply.js'
import { sendScheduled } from './methods/messages/send-scheduled.js'
import { sendText } from './methods/messages/send-text.js'
import { sendTyping } from './methods/messages/send-typing.js'
import { sendVote } from './methods/messages/send-vote.js'
import { setTyping } from './methods/messages/set-typing.js'
import { toggleTodoCompleted } from './methods/messages/toggle-todo-completed.js'
import { translateMessage } from './methods/messages/translate-message.js'
import { translateText } from './methods/messages/translate-text.js'
import { unpinAllMessages } from './methods/messages/unpin-all-messages.js'
import { unpinMessage } from './methods/messages/unpin-message.js'
import { getCollectibleInfo } from './methods/misc/get-collectible-info.js'
import { initTakeoutSession } from './methods/misc/init-takeout-session.js'
import { _normalizePrivacyRules } from './methods/misc/normalize-privacy-rules.js'
import { withParams } from './methods/misc/with-params.js'
import { changeCloudPassword } from './methods/password/change-cloud-password.js'
import { enableCloudPassword } from './methods/password/enable-cloud-password.js'
import { cancelPasswordEmail, resendPasswordEmail, verifyPasswordEmail } from './methods/password/password-email.js'
import { removeCloudPassword } from './methods/password/remove-cloud-password.js'
import { _normalizeInputStarGift } from './methods/premium/_normalize-input-star-gift.js'
import { acceptStarGift } from './methods/premium/accept-star-gift.js'
import { applyBoost } from './methods/premium/apply-boost.js'
import { buyResaleGift } from './methods/premium/buy-resale-gift.js'
import { canApplyBoost } from './methods/premium/can-apply-boost.js'
import { createBusinessChatLink } from './methods/premium/create-business-chat-link.js'
import { deleteBusinessChatLink, editBusinessChatLink } from './methods/premium/edit-business-chat-link.js'
import { getBoostStats } from './methods/premium/get-boost-stats.js'
import { getBoosts } from './methods/premium/get-boosts.js'
import { getBusinessChatLinks } from './methods/premium/get-business-chat-links.js'
import { getBusinessConnection } from './methods/premium/get-business-connection.js'
import { getMyBoostSlots } from './methods/premium/get-my-boost-slots.js'
import { getResaleOptions } from './methods/premium/get-resale-star-gifts.js'
import { getSavedStarGiftsById } from './methods/premium/get-saved-star-gifts-by-id.js'
import { getSavedStarGifts } from './methods/premium/get-saved-star-gifts.js'
import { getStarGiftOptions } from './methods/premium/get-star-gift-options.js'
import { getStarGiftWithdrawalUrl } from './methods/premium/get-star-gift-withdrawal-url.js'
import { getStarsTransactions } from './methods/premium/get-stars-transactions.js'
import { getUniqueStarGift } from './methods/premium/get-unique-star-gift.js'
import { iterBoosters } from './methods/premium/iter-boosters.js'
import { iterSavedStarGifts } from './methods/premium/iter-saved-star-gifts.js'
import { iterStarsTransactions } from './methods/premium/iter-stars-transactions.js'
import { togglePinnedStarGifts } from './methods/premium/pin-star-gift.js'
import { sendStarGift } from './methods/premium/send-star-gift.js'
import { setBusinessIntro } from './methods/premium/set-business-intro.js'
import { setBusinessWorkHours } from './methods/premium/set-business-work-hours.js'
import { setResaleStarGiftPrice } from './methods/premium/set-gift-resale-price.js'
import { transferStarGift } from './methods/premium/transfer-star-gift.js'
import { upgradeStarGift } from './methods/premium/upgrade-star-gift.js'
import { addStickerToSet } from './methods/stickers/add-sticker-to-set.js'
import { createStickerSet } from './methods/stickers/create-sticker-set.js'
import { deleteStickerFromSet } from './methods/stickers/delete-sticker-from-set.js'
import { getCustomEmojis, getCustomEmojisFromMessages } from './methods/stickers/get-custom-emojis.js'
import { getInstalledStickers } from './methods/stickers/get-installed-stickers.js'
import { getMyStickerSets } from './methods/stickers/get-my-sticker-sets.js'
import { getStickerSet } from './methods/stickers/get-sticker-set.js'
import { moveStickerInSet } from './methods/stickers/move-sticker-in-set.js'
import { replaceStickerInSet } from './methods/stickers/replace-sticker-in-set.js'
import { setChatStickerSet } from './methods/stickers/set-chat-sticker-set.js'
import { setStickerSetThumb } from './methods/stickers/set-sticker-set-thumb.js'
import { canSendStory } from './methods/stories/can-send-story.js'
import { deleteStories } from './methods/stories/delete-stories.js'
import { editStory } from './methods/stories/edit-story.js'
import { getAllStories } from './methods/stories/get-all-stories.js'
import { getPeerStories } from './methods/stories/get-peer-stories.js'
import { getProfileStories } from './methods/stories/get-profile-stories.js'
import { getStoriesById } from './methods/stories/get-stories-by-id.js'
import { getStoriesInteractions } from './methods/stories/get-stories-interactions.js'
import { getStoryLink } from './methods/stories/get-story-link.js'
import { getStoryViewers } from './methods/stories/get-story-viewers.js'
import { hideMyStoriesViews } from './methods/stories/hide-my-stories-views.js'
import { incrementStoriesViews } from './methods/stories/increment-stories-views.js'
import { iterAllStories } from './methods/stories/iter-all-stories.js'
import { iterProfileStories } from './methods/stories/iter-profile-stories.js'
import { iterStoryViewers } from './methods/stories/iter-story-viewers.js'
import { readStories } from './methods/stories/read-stories.js'
import { sendStoryReaction } from './methods/stories/send-story-reaction.js'
import { sendStory } from './methods/stories/send-story.js'
import { togglePeerStoriesArchived } from './methods/stories/toggle-peer-stories-archived.js'
import { toggleStoriesPinned } from './methods/stories/toggle-stories-pinned.js'
import { blockUser } from './methods/users/block-user.js'
import { deleteProfilePhotos } from './methods/users/delete-profile-photos.js'
import { editCloseFriends, editCloseFriendsRaw } from './methods/users/edit-close-friends.js'
import { getCommonChats } from './methods/users/get-common-chats.js'
import { getGlobalTtl } from './methods/users/get-global-ttl.js'
import { getMe } from './methods/users/get-me.js'
import { getMyUsername } from './methods/users/get-my-username.js'
import { getPeerSettings } from './methods/users/get-peer-settings.js'
import { getProfilePhoto } from './methods/users/get-profile-photo.js'
import { getProfilePhotos } from './methods/users/get-profile-photos.js'
import { getUsers } from './methods/users/get-users.js'
import { isPeerAvailable } from './methods/users/is-peer-available.js'
import { iterProfilePhotos } from './methods/users/iter-profile-photos.js'
import { resolvePeerMany } from './methods/users/resolve-peer-many.js'
import { resolveChannel, resolvePeer, resolveUser } from './methods/users/resolve-peer.js'
import { resolvePhoneNumber } from './methods/users/resolve-phone-number.js'
import { setEmojiStatus, setMyEmojiStatus } from './methods/users/set-emoji-status.js'
import { setGlobalTtl } from './methods/users/set-global-ttl.js'
import { setMyBirthday } from './methods/users/set-my-birthday.js'
import { setMyProfilePhoto } from './methods/users/set-my-profile-photo.js'
import { setMyUsername } from './methods/users/set-my-username.js'
import { sendOnline, setOnline } from './methods/users/set-online.js'
import { unblockUser } from './methods/users/unblock-user.js'
import { updateProfile } from './methods/users/update-profile.js'
import { Conversation } from './types/conversation.js'
import { makeParsedUpdateHandler } from './updates/parsed.js'
// from methods/_init.ts
// @copy
type TelegramClientOptions = (
    | (PartialOnly<Omit<BaseTelegramClientOptions, 'storage'>, 'transport' | 'crypto' | 'platform'> & {
        /**
         * Storage to use for this client.
         *
         * If a string is passed, it will be used as
         * a name for the default platform-specific storage provider to use.
         *
         * @default `"client.session"`
         */
        storage?: string | ITelegramStorageProvider
    })
    | { client: ITelegramClient }
) & {
    /**
     * If true, all API calls will be wrapped with `tl.invokeWithoutUpdates`,
     * effectively disabling the server-sent events for the clients.
     * May be useful in some cases.
     *
     * @default false
     */
    disableUpdates?: boolean
    updates?: Omit<ParsedUpdateHandlerParams, 'onUpdate'>
    /**
     * If `true`, the updates that were handled by some {@link Conversation}
     * will not be dispatched any further.
     *
     * @default  true
     */
    skipConversationUpdates?: boolean
}

export interface TelegramClient extends ITelegramClient {
/** Raw update emitter */
    readonly onRawUpdate: Emitter<RawUpdateInfo>
    /** Parsed update emitter */
    readonly onUpdate: Emitter<ParsedUpdate>/** a new message handler */
    readonly onNewMessage: Emitter<Message>
    /** an edit message handler */
    readonly onEditMessage: Emitter<Message>
    /** a message group handler */
    readonly onMessageGroup: Emitter<Message[]>
    /** a delete message handler */
    readonly onDeleteMessage: Emitter<DeleteMessageUpdate>
    /** a chat member update handler */
    readonly onChatMemberUpdate: Emitter<ChatMemberUpdate>
    /** an inline query handler */
    readonly onInlineQuery: Emitter<InlineQuery>
    /** a chosen inline result handler */
    readonly onChosenInlineResult: Emitter<ChosenInlineResult>
    /** a callback query handler */
    readonly onCallbackQuery: Emitter<CallbackQuery>
    /** an inline callback query handler */
    readonly onInlineCallbackQuery: Emitter<InlineCallbackQuery>
    /** a business callback query handler */
    readonly onBusinessCallbackQuery: Emitter<BusinessCallbackQuery>
    /** a poll update handler */
    readonly onPollUpdate: Emitter<PollUpdate>
    /** a poll vote handler */
    readonly onPollVote: Emitter<PollVoteUpdate>
    /** an user status update handler */
    readonly onUserStatusUpdate: Emitter<UserStatusUpdate>
    /** an user typing handler */
    readonly onUserTyping: Emitter<UserTypingUpdate>
    /** a history read handler */
    readonly onHistoryRead: Emitter<HistoryReadUpdate>
    /** a bot stopped handler */
    readonly onBotStopped: Emitter<BotStoppedUpdate>
    /** a bot chat join request handler */
    readonly onBotChatJoinRequest: Emitter<BotChatJoinRequestUpdate>
    /** a chat join request handler */
    readonly onChatJoinRequest: Emitter<ChatJoinRequestUpdate>
    /** a pre checkout query handler */
    readonly onPreCheckoutQuery: Emitter<PreCheckoutQuery>
    /** a story update handler */
    readonly onStoryUpdate: Emitter<StoryUpdate>
    /** a delete story handler */
    readonly onDeleteStory: Emitter<DeleteStoryUpdate>
    /** a bot reaction update handler */
    readonly onBotReactionUpdate: Emitter<BotReactionUpdate>
    /** a bot reaction count update handler */
    readonly onBotReactionCountUpdate: Emitter<BotReactionCountUpdate>
    /** a business connection update handler */
    readonly onBusinessConnectionUpdate: Emitter<BusinessConnection>
    /** a new business message handler */
    readonly onNewBusinessMessage: Emitter<BusinessMessage>
    /** an edit business message handler */
    readonly onEditBusinessMessage: Emitter<BusinessMessage>
    /** a business message group handler */
    readonly onBusinessMessageGroup: Emitter<BusinessMessage[]>
    /** a delete business message handler */
    readonly onDeleteBusinessMessage: Emitter<DeleteBusinessMessageUpdate>
    /**
     * Wrap this client so that all RPC calls will use the specified parameters.
     *
     * @param params  Parameters to use
     * @returns  Wrapped client
     */
    withParams(params: RpcCallOptions): this
    /**
     * Check your Two-Step verification password and log in
     *
     * **Available**: 👤 users only
     *
     * @returns  The authorized user
     * @throws BadRequestError  In case the password is invalid
     */
    checkPassword(
        options: string | {
        /** Your Two-Step verification password */
            password: string

            /** Existing response from `account.getPassword`, if available (to avoid extra API calls) */
            passwordObj?: tl.account.TypePassword

            /** Abort signal */
            abortSignal?: AbortSignal
        }): Promise<User>
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
    logOut(): Promise<LogOutResult>
    /**
     * Recover your password with a recovery code and log in.
     *
     * **Available**: 👤 users only
     *
     * @returns  The authorized user
     * @throws BadRequestError  In case the code is invalid
     */
    recoverPassword(
        params: {
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
    resendCode(
        params: {
        /** Phone number in international format */
            phone: string

            /** Confirmation code identifier from {@link SentCode} */
            phoneCodeHash: string

            /** Abort signal */
            abortSignal?: AbortSignal
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
     * @deprecated  This method provides no real value over {@link start}, please use it instead
     */
    run(
        params: Parameters<typeof start>[1],
        then?: (user: User) => void | Promise<void>): void
    /**
     * Send the confirmation code to the given phone number
     *
     * **Available**: 👤 users only
     *
     * @returns  An object containing information about the sent confirmation code,
     *     or a user if the user was already logged in
     */
    sendCode(
        params: {
        /** Phone number in international format */
            phone: string

            /** Saved future auth tokens, if any */
            futureAuthTokens?: Uint8Array[]

            /** Additional code settings to pass to the server */
            codeSettings?: Omit<tl.RawCodeSettings, '_' | 'logoutTokens'>

            /** Abort signal */
            abortSignal?: AbortSignal
        }): Promise<SentCode | User>
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
     * Execute the [QR login flow](https://core.telegram.org/api/qr-login).
     *
     * This method will resolve once the authorization is complete,
     * returning the authorized user.
     * **Available**: 👤 users only
     *
     */
    signInQr(
        params: {
        /**
         * Function that will be called whenever the login URL is changed.
         *
         * The app is expected to display `url` as a QR code to the user
         */
            onUrlUpdated: (url: string, expires: Date) => void

            /**
             * Function that will be called when the user has scanned the QR code
             * (i.e. when `updateLoginToken` is received), and the library is finalizing the auth
             */
            onQrScanned?: () => void

            /** Password for 2FA */
            password?: MaybeDynamic<string>

            /**
             * Function that will be called after the server has rejected the password.
             *
             * Note that in case {@link password} is not a function,
             * this callback will never be called, and an error will be thrown instead.
             */
            invalidPasswordCallback?: () => MaybePromise<void>

            /** Abort signal */
            abortSignal?: AbortSignal
        }): Promise<User>
    /**
     * Authorize a user in Telegram with a valid confirmation code.
     *
     * **Available**: 👤 users only
     *
     * @returns  If the code was valid and authorization succeeded, the {@link User} is returned.
     * @throws  BadRequestError  In case the arguments are invalid
     * @throws  SessionPasswordNeededError  In case a password is needed to sign in
     */
    signIn(
        params: {
        /** Phone number in international format */
            phone: string
            /** Code identifier from {@link sendCode} */
            phoneCodeHash: string
            /** The confirmation code that was received */
            phoneCode: string
            /** Abort signal */
            abortSignal?: AbortSignal
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
    startTest(
        params?: {
        /**
         * Whether to log out if current session is logged in.
         *
         * @default  false.
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
     * can either supply `T`, or a function that returns `MaybePromise<T>`
     *
     * This method is intended for simple and fast use in automated
     * scripts and bots. If you are developing a custom client,
     * you'll probably need to use other auth methods.
     * **Available**: ✅ both users and bots
     *
     */
    start(
        params: {
        /**
         * String session exported using {@link TelegramClient.exportSession}.
         *
         * This simply calls {@link TelegramClient.importSession} before anything else.
         *
         * Note that passed session will be ignored in case storage already
         * contains authorization.
         */
            session?: string | InputStringSessionData

            /**
             * Whether to overwrite existing session.
             */
            sessionForce?: boolean

            /**
             * When passed, [QR login flow](https://core.telegram.org/api/qr-login)
             * will be used instead of the regular login flow.
             *
             * This function will be called whenever the login URL is changed,
             * and the app is expected to display it as a QR code to the user.
             */
            qrCodeHandler?: (url: string, expires: Date) => void

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
            invalidCodeCallback?: (type: 'code' | 'password') => MaybePromise<void>

            /**
             * Whether to force code delivery through SMS
             */
            forceSms?: boolean

            /**
             * Custom method that is called when a code is sent. Can be used
             * to show a GUI alert of some kind.
             *
             * This method is called *before* {@link start.params.code}.
             *
             * @param code
             * @default  `console.log`.
             */
            codeSentCallback?: (code: SentCode) => MaybePromise<void>

            /** Saved future auth tokens, if any */
            futureAuthTokens?: Uint8Array[]

            /** Additional code settings to pass to the server */
            codeSettings?: Omit<tl.RawCodeSettings, '_' | 'logoutTokens'>

            /** Abort signal */
            abortSignal?: AbortSignal
        }): Promise<User>
    /**
     * Check if the given peer/input peer is referring to the current user
     * **Available**: ✅ both users and bots
     *
     */
    isSelfPeer(
        peer: tl.TypeInputPeer | tl.TypePeer | tl.TypeInputUser): boolean
    /**
     * Send an answer to a callback query.
     *
     * **Available**: 🤖 bots only
     *
     * @param queryId  ID of the callback query, or the query itself
     * @param params  Parameters of the answer
     */
    answerCallbackQuery(
        queryId: Long | CallbackQuery,
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
        }): Promise<void>
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
        queryId: tl.Long | InlineQuery,
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
             * If passed, clients will display a button on top of the remaining inline result
             * list with the specified text, that switches the user to the specified bot web app.
             */
            switchWebview?: {
            /**
             * Text of the button
             */
                text: string

                /**
                 * URL to open
                 */
                url: string
            }
        }): Promise<void>
    /**
     * Answer a pre-checkout query.
     *
     * **Available**: 🤖 bots only
     *
     * @param queryId  Pre-checkout query ID
     */
    answerPreCheckoutQuery(
        queryId: tl.Long | PreCheckoutQuery,
        params?: {
        /** If pre-checkout is rejected, error message to show to the user */
            error?: string
        }): Promise<void>
    /**
     * Delete commands for the current bot and the given scope.
     *
     * Does the same as passing `null` to  {@link setMyCommands}
     *
     * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
     * **Available**: 🤖 bots only
     *
     */
    deleteMyCommands(
        params?: {
        /**
         * Scope of the commands.
         *
         * @default  `BotScope.default_` (i.e. `botCommandScopeDefault`)
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
    getBotInfo(
        params: {
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
    getCallbackAnswer(
        params: InputMessageId & {
        /** Data contained in the button */
            data: string | Uint8Array

            /**
             * Timeout for the query in ms.
             *
             * @default  `10000` (10 sec)
             */
            timeout?: number

            /**
             * Whether to "fire and forget" this request,
             * in which case the promise will resolve as soon
             * as the request is sent with an empty response.
             *
             * Useful for interacting with bots that don't correctly
             * answer to callback queries and the request always times out.
             *
             * **Note**: any errors will be silently ignored.
             */
            fireAndForget?: boolean

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
    getGameHighScores(
        params: InputMessageId & {
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
        userId?: InputPeerLike): Promise<GameHighScore[]>
    /**
     * Get a list of current bot's commands for the given command scope
     * and user language. If they are not set, empty set is returned.
     *
     * Learn more about scopes in the [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
     * **Available**: 🤖 bots only
     *
     */
    getMyCommands(
        params?: {
        /**
         * Scope of the commands.
         *
         * @default  `BotScope.default_` (i.e. `botCommandScopeDefault`)
         */
            scope?: tl.TypeBotCommandScope | BotCommands.IntermediateScope

            /**
             * User language applied to the scope.
             */
            langCode?: string
        }): Promise<tl.RawBotCommand[]>
    /**
     * Open a webview.
     * **Available**: 👤 users only
     *
     */
    openWebview(
        params: {
        /** Information about the webview to open */
            webview: InputWebview

            /**
             * Bot whose webview to open
             */
            bot: InputPeerLike

            /**
             * Chat to report to the server as the "currently open chat",
             * also the chat to which the message will be sent in case of
             * `from_inline_keyboard`, `from_bot_menu` and `from_attach_menu` webviews
             */
            chat?: InputPeerLike

            /**
             * Theme parameters to pass to the mini app
             *
             * Each value should be a string (hex-encoded RGB, no alpha)
             */
            theme?: tl.TypeDataJSON | {
            // https://corefork.telegram.org/api/bots/webapps#theme-parameters
            /** Background color */
                bg_color?: string
                /** Secondary background color */
                secondary_bg_color?: string
                /** Text color */
                text_color?: string
                /** Hint text color */
                hint_color?: string
                /** Link color */
                link_color?: string
                /** Button color */
                button_color?: string
                /** Button text color */
                button_text_color?: string
                /** Header background color */
                header_bg_color?: string
                /** Accent text color */
                accent_text_color?: string
                /** Section background color */
                section_bg_color?: string
                /** Section header text color */
                section_header_text_color?: string
                /** Section separator color */
                section_separator_color?: string
                /** Sub title text color */
                subtitle_text_color?: string
                /** Text color for destructive action buttons in prompts */
                destructive_text_color?: string
            }

            /**
             * Webview platform to use in the init data
             *
             * Some of the known values:
             *  - `android` - Android clients
             *  - `ios` - iOS clients
             *  - `tdesktop` - Telegram Desktop
             *  - `macos` - Telegram for macOS
             *  - `unigram` - Unigram
             */
            platform:
              | 'android'
              | 'ios'
              | 'tdesktop'
              | 'macos'
              | 'unigram'
              | (string & {})
        }): Promise<WebviewResult>
    /**
     * Close a webview previously opened by {@link openWebview} method.
     *
     * **Available**: ✅ both users and bots
     *
     * @param webview  Webview result returned by {@link openWebview}, or its `.queryId`
     */
    closeWebview(
        webview: WebviewResult | tl.Long): Promise<void>
    /**
     * Prepare an inline message result to be sent later via the
     * `shareMessage` [mini-app api method](https://core.telegram.org/bots/webapps#initializing-mini-apps).
     * **Available**: 🤖 bots only
     *
     */
    prepareInlineMessage(
        params: {
            userId: InputPeerLike
            result: InputInlineResult

            /**
             * Filters for the client to use when prompting the user for the
             * chat to send the inline message to.
             *
             * Note that this is just a hint for the client, and the client is free to ignore it.
             */
            filter?: tl.TypeInlineQueryPeerType[] | {
            /** private chat with the bot itself */
                botSelf?: boolean
                /** private chats */
                private?: boolean
                /** private chats with other bots */
                bots?: boolean
                /** "basic" chats */
                chats?: boolean
                /** supergroups */
                supergroups?: boolean
                /** broadcast channels */
                channels?: boolean
            }
        }): Promise<tl.messages.TypeBotPreparedInlineMessage>
    /**
     * Sets information about a bot the current uzer owns (or the current bot)
     * **Available**: ✅ both users and bots
     *
     */
    setBotInfo(
        params: {
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
     * **Available**: 🤖 bots only
     *
     */
    setBotMenuButton(
        user: InputPeerLike,
        button: tl.TypeBotMenuButton): Promise<void>
    /**
     * Set a score of a user in a game
     *
     * **Available**: 🤖 bots only
     *
     * @param params
     * @returns  The modified message
     */
    setGameScore(
        params: InputMessageId & {
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

            /**
             * Whether to dispatch the edit message event
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message>
    /**
     * Set a score of a user in a game contained in
     * an inline message
     *
     * **Available**: 🤖 bots only
     *
     * @param params
     */
    setInlineGameScore(
        params: {
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
    setMyCommands(
        params: {
        /**
         * New list of bot commands for the given scope.
         *
         * Pass empty array or `null` to delete them.
         */
            commands: tl.RawBotCommand[] | null

            /**
             * Scope of the commands.
             *
             * @default  `BotScope.default_` (i.e. `botCommandScopeDefault`)
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
    setMyDefaultRights(
        params: {
        /** Whether to target groups or channels. */
            target: 'channel' | 'group'
            /** The default chat permissions. */
            rights: Omit<tl.RawChatAdminRights, '_'>
        }): Promise<void>
    /**
     * Give or revoke permission for a bot to update emoji status for your account
     * **Available**: 👤 users only
     *
     */
    toggleEmojiStatusPermission(
        params: {
        /** Bot to which the permission should be granted/revoked */
            userId: InputPeerLike
            /** Whether to grant or revoke permission */
            allow: boolean
        }): Promise<void>
    /**
     * Add one or more new members to a group, supergroup or channel.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  ID of the chat or its username
     * @param users ID(s) of the user(s) to add
     * @returns  List of users that were failed to be invited (may be empty)
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
        }): Promise<tl.RawMissingInvitee[]>
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
    banChatMember(
        params: {
        /** Chat ID */
            chatId: InputPeerLike

            /** ID of the user/channel to ban */
            participantId: InputPeerLike

            untilDate?: number | Date

            /**
             * Whether to dispatch the returned service message (if any)
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message | null>
    /**
     * Create a new broadcast channel
     *
     * **Available**: 👤 users only
     *
     * @returns  Newly created channel
     */
    createChannel(
        params: {
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
    createGroup(
        params: {
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
        }): Promise<CreateGroupResult>
    /**
     * Create a new supergroup
     *
     * **Available**: 👤 users only
     *
     * @returns  Newly created supergroup
     */
    createSupergroup(
        params: {
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
         * - `delete`: delete messages (only for yourself) AND the dialog itself
         * - `clear`: delete messages (only for yourself), but keep the dialog in the list
         * - `revoke`: delete messages for all users
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
        }): Promise<void>
    /**
     * Delete all messages of a user (or channel) in a supergroup
     * **Available**: 👤 users only
     *
     */
    deleteUserHistory(
        params: {
        /** Chat ID */
            chatId: InputPeerLike
            /** User/channel ID whose messages to delete */
            participantId: InputPeerLike

            /**
             * Whether to dispatch the updates that will be generated by this call.
             * Doesn't follow `disableNoDispatch`
             */
            shouldDispatch?: true
        }): Promise<void>
    /**
     * Edit supergroup/channel admin rights of a user.
     * **Available**: ✅ both users and bots
     *
     */
    editAdminRights(
        params: {
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
        }): Promise<ChatEvent[]>
    /**
     * Get information about a single chat member
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID or username
     * @param userId  User ID, username, phone number, `"me"` or `"self"`
     * @returns  Chat member, or `null` if user is not a member of the chat
     */
    getChatMember(
        params: {
        /** Chat ID or username */
            chatId: InputPeerLike
            /** User ID, username, phone number, `"me"` or `"self"` */
            userId: InputPeerLike
        }): Promise<ChatMember | null>
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
         *
         * > **Note**: Only used for these values of `filter`:
         * > `all, banned, restricted, mention, contacts`
         *
         * @default  `''` (empty string)
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
             *  Only used for channels and supergroups.
             *
             * @default  `recent`
             */
            type?: 'all' | 'banned' | 'restricted' | 'bots' | 'recent' | 'admins' | 'contacts' | 'mention'
        }): Promise<ArrayWithTotal<ChatMember>>
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
     * **Available**: ✅ both users and bots
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
     * **Available**: ✅ both users and bots
     *
     * @param chatId  ID of the chat, its username or invite link
     * @throws MtArgumentError
     *   In case you are trying to get info about private chat that you haven't joined.
     *   Use {@link getChatPreview} instead.
     */
    getFullChat(chatId: InputPeerLike): Promise<FullChat>

    /**
     * Get full information about a user.
     *
     * **Available**: ✅ both users and bots
     *
     * @param userId  ID of the user or their username
     */
    getFullUser(userId: InputPeerLike): Promise<FullUser>

    getMessageAuthor(
        message: InputMessageId): Promise<User>
    /**
     * Get nearby chats
     *
     * **Available**: 👤 users only
     *
     * @param latitude  Latitude of the location
     * @param longitude  Longitude of the location
     */
    getNearbyChats(latitude: number, longitude: number): Promise<Chat[]>
    /** Shorthand for {@link getChat} and {@link getUser} depending on the type of the peer */
    getPeer(peer: InputPeerLike): Promise<Peer>

    /**
     * Get channels that are similar to a given channel
     *
     * > **Note**: This method only returns the channels that the current user
     * > is not subscribed to. For non-premium users, this method will only return
     * > a few channels (with the total number of similar channels being specified in `.total`)
     * >
     * > Returns empty array in case there are no similar channels available.
     * **Available**: 👤 users only
     *
     */
    getSimilarChannels(
        channel: InputPeerLike): Promise<ArrayWithTotal<Chat>>

    /**
     * Get basic information about a user.
     *
     * **Available**: ✅ both users and bots
     *
     * @param userId  ID of the user or their username or invite link
     */
    getUser(userId: InputPeerLike): Promise<User>
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
        }): AsyncIterableIterator<ChatEvent>
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
         * @default  `200`
         */
            chunkSize?: number
        }): AsyncIterableIterator<ChatMember>
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
     *
     * **Available**: ✅ both users and bots
     *
     *  @returns  Service message about removed user, if one was generated.
     */
    kickChatMember(
        params: {
        /** Chat ID */
            chatId: InputPeerLike
            /** User ID */
            userId: InputPeerLike
        }): Promise<Message | null>
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
        }): Promise<void>
    /**
     * Mark a chat as unread
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     */
    markChatUnread(chatId: InputPeerLike): Promise<void>
    /**
     * Inform the library that the user has opened a chat.
     *
     * Some library logic depends on this, for example, the library will
     * periodically ping the server to keep the updates flowing.
     *
     * > **Warning**: Opening a chat with `openChat` method will make the library make additional requests
     * > every so often. Which means that you should **avoid opening more than 5-10 chats at once**,
     * > as it will probably trigger server-side limits and you might start getting transport errors
     * > or even get banned.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chat  Chat to open
     */
    openChat(chat: InputPeerLike): Promise<void>
    /**
     * Inform the library that the user has closed a chat.
     * Un-does the effect of {@link openChat}.
     *
     * Some library logic depends on this, for example, the library will
     * periodically ping the server to keep the updates flowing.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chat  Chat to open
     */
    closeChat(chat: InputPeerLike): Promise<void>
    /**
     * Reorder usernames
     *
     * **Available**: 👤 users only
     *
     * @param peerId  Bot, channel or "me"/"self"
     */
    reorderUsernames(
        peerId: InputPeerLike,
        order: string[]): Promise<void>
    /**
     * Restrict a user in a supergroup.
     * **Available**: ✅ both users and bots
     *
     */
    restrictChatMember(
        params: {
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
    saveDraft(
        chatId: InputPeerLike,
        draft: null | Omit<tl.RawDraftMessage, '_' | 'date'>): Promise<void>

    /**
     * Set peer color and optionally background pattern
     * **Available**: 👤 users only
     *
     */
    setChatColor(
        params: {
        /**
         * Peer where to update the color.
         *
         * By default will change the color for the current user
         */
            peer?: InputPeerLike

            /**
             * Color identificator
             *
             * Note that this value is **not** an RGB color representation. Instead, it is
             * a number which should be used to pick a color from a predefined
             * list of colors:
             *  - `0-6` are the default colors used by Telegram clients:
             *    `red, orange, purple, green, sea, blue, pink`
             *  - `>= 7` are returned by `help.getAppConfig`.
             */
            color: number

            /**
             * Background pattern emoji ID.
             *
             * Must be an adaptive emoji, otherwise the request will fail.
             */
            backgroundEmojiId?: tl.Long

            /**
             * Whether to set this color for the profile
             * header instead of chat name/replies.
             *
             * Currently only available for the current user.
             */
            forProfile?: boolean
        }): Promise<void>
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
        restrictions: Omit<tl.RawChatBannedRights, '_' | 'untilDate'>): Promise<Chat>
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
    setChatDescription(
        chatId: InputPeerLike,
        description: string): Promise<void>
    /**
     * Set a new chat photo or video.
     *
     * You must be an administrator and have the appropriate permissions.
     * **Available**: ✅ both users and bots
     *
     */
    setChatPhoto(
        params: {
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
    setChatUsername(
        chatId: InputPeerLike,
        username: string | null): Promise<void>
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
    toggleContentProtection(
        chatId: InputPeerLike, enabled?: boolean): Promise<void>
    /**
     * Toggle a collectible (Fragment) username
     *
     * > **Note**: non-collectible usernames must still be changed
     * > using {@link setUsername}/{@link setChatUsername}
     * **Available**: 👤 users only
     *
     */
    toggleFragmentUsername(
        params: {
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
    toggleJoinRequests(
        chatId: InputPeerLike, enabled?: boolean): Promise<void>
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
    unbanChatMember(
        params: {
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
    unrestrictChatMember(
        params: {
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
    addContact(
        params: {
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
             * with the newly created contact
             *
             * @default false
             */
            sharePhone?: boolean
        }): Promise<User>
    /**
     * Delete one or more contacts from your Telegram contacts list
     *
     * Returns deleted contact's profiles. Does not return
     * profiles of users that were not in your contacts list
     *
     * **Available**: 👤 users only
     *
     * @param userIds  User IDs, usernames or phone numbers
     */
    deleteContacts(userIds: MaybeArray<InputPeerLike>): Promise<User[]>
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
        contacts: PartialOnly<Omit<tl.RawInputPhoneContact, '_'>, 'clientId'>[]): Promise<tl.contacts.RawImportedContacts>
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
    createFolder(
        folder: PartialExcept<tl.RawDialogFilter, 'title'>): Promise<tl.RawDialogFilter>
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
    editFolder(
        params: {
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
     * Try to find a dialog (dialogs) with a given peer (peers) by their ID, username or phone number.
     *
     * This might be an expensive call, as it will potentially iterate over all
     * dialogs to find the one with the given peer
     *
     * **Available**: 👤 users only
     *
     * @throws {MtPeerNotFoundError}  If a dialog with any of the given peers was not found
     */
    findDialogs(peers: MaybeArray<string | number>): Promise<Dialog[]>
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
    findFolder(
        params: {
        /** Folder title */
            title?: string
            /** Folder emoji */
            emoji?: string
            /** Folder ID */
            id?: number
        }): Promise<tl.RawDialogFilter | null>
    /**
     * Get a preview of a chatlist by its invite link
     *
     * **Available**: 👤 users only
     *
     * @param link  Invite link
     */
    getChatlistPreview(link: string): Promise<ChatlistPreview>
    /**
     * Get list of folders.
     * **Available**: 👤 users only
     *
     */
    getFolders(): Promise<tl.messages.RawDialogFilters>
    /**
     * Get dialogs with certain peers.
     *
     * **Available**: 👤 users only
     *
     * @param peers  Peers for which to fetch dialogs.
     */
    getPeerDialogs(
        peers: MaybeArray<InputPeerLike>): Promise<(Dialog | null)[]>
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
    iterDialogs(
        params?: {
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
             * orders of magnitudes* slower than normal because
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
     * Join a chatlist by its link
     *
     * **Available**: 👤 users only
     *
     * @param link  Invite link to the chatlist
     * @param params  Additional parameters
     * @returns  Folder representing the chatlist
     */
    joinChatlist(
        link: string,
        params?: {
        /** Chats to join from the chatlist (all by default) */
            peers?: MaybeArray<InputPeerLike>
        }): Promise<tl.RawDialogFilterChatlist>
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
    downloadAsBuffer(
        location: FileDownloadLocation,
        params?: FileDownloadParameters): Promise<Uint8Array>

    /**
     * Download a remote file to a local file (only for Node.js).
     * Promise will resolve once the download is complete.
     *
     * **Available**: ✅ both users and bots
     *
     * @param filename  Local file name to which the remote file will be downloaded
     * @param params  File download parameters
     */
    downloadToFile(
        filename: string,
        location: FileDownloadLocation,
        params?: FileDownloadParameters): Promise<void>
    /**
     * Download a file and return it as an iterable, which yields file contents
     * in chunks of a given size. Order of the chunks is guaranteed to be
     * consecutive.
     *
     * **Available**: 👤 users only
     *
     * @param params  Download parameters
     */
    downloadAsIterable(
        input: FileDownloadLocation,
        params?: FileDownloadParameters): AsyncIterableIterator<Uint8Array>

    /**
     * Download a remote file as a Node.js Readable stream.
     *
     * **Available**: ✅ both users and bots
     *
     * @param params  File download parameters
     */
    downloadAsNodeStream(
        location: FileDownloadLocation,
        params?: FileDownloadParameters): import('node:stream').Readable
    /**
     * Download a file and return it as a `@fuman/io` stream,
     * streaming file contents.
     *
     * **Available**: ✅ both users and bots
     *
     * @param params  File download parameters
     */
    downloadAsStream(
        location: FileDownloadLocation,
        params?: FileDownloadParameters): ReadableStream<Uint8Array>
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
            abortSignal?: AbortSignal
            fileName?: string
            fileSize?: number
            fileMime?: string
        }): Promise<tl.TypeInputFile>
    /**
     * Normalize an {@link InputMediaLike} to `InputMedia`,
     * uploading the file if needed.
     * **Available**: ✅ both users and bots
     *
     */
    _normalizeInputMedia(
        media: InputMediaLike, params?: {
            progressCallback?: (uploaded: number, total: number) => void
            uploadPeer?: tl.TypeInputPeer
            abortSignal?: AbortSignal
            businessConnectionId?: string
        }, uploadMedia?: boolean): Promise<tl.TypeInputMedia>

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
    uploadFile(
        params: {
        /**
         * Upload file source.
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

            /**
             * When using `inputMediaUploadedPhoto` (e.g. when sending an uploaded photo) require
             * the file size to be known beforehand.
             *
             * In case this is set to `true`, a stream is passed as `file` and the file size is unknown,
             * the stream will be buffered in memory and the file size will be inferred from the buffer.
             */
            requireFileSize?: boolean

            /**
             * When using `inputMediaUploadedPhoto` (e.g. when sending an uploaded photo) require
             * the file extension to be known beforehand.
             *
             * This will make the library try to guess the file extension from the file mime type,
             * or throw an error if it cannot be guessed.
             */
            requireExtension?: boolean

            abortSignal?: AbortSignal
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
        media: InputMediaLike, params?: {
            peer?: InputPeerLike
            progressCallback?: (uploaded: number, total: number) => void
        }): Promise<Extract<MessageMedia, Photo | RawDocument>>
    /**
     * Create a topic in a forum
     *
     * Only admins with `manageTopics` permission can do this.
     *
     * **Available**: ✅ both users and bots
     *
     * @returns  Service message for the created topic
     */
    createForumTopic(
        params: {
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

            /**
             * Whether to dispatch the returned service message (if any)
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message>
    /**
     * Delete a forum topic and all its history
     *
     * **Available**: ✅ both users and bots
     *
     * @param chat  Chat or user ID, username, phone number, `"me"` or `"self"`
     * @param topicId  ID of the topic (i.e. its top message ID)
     */
    deleteForumTopicHistory(
        chat: InputPeerLike,
        topicId: number | ForumTopic,
        params?: {
        /**
         * Whether to dispatch updates that will be generated by this call.
         * Doesn't follow `disableNoDispatch`
         */
            shouldDispatch?: true
        }): Promise<void>
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
    editForumTopic(
        params: {
        /** Chat ID or username */
            chatId: InputPeerLike

            /** ID of the topic (i.e. its top message ID) */
            topicId: number | ForumTopic

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

            /**
             * Whether to dispatch the returned service message (if any)
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message>
    /**
     * Get forum topics by their IDs
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID or username
     */
    getForumTopicsById(
        chatId: InputPeerLike,
        ids: MaybeArray<number>): Promise<ForumTopic[]>
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
        }): Promise<ArrayPaginated<ForumTopic, GetForumTopicsOffset>>
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
        }): AsyncIterableIterator<ForumTopic>
    /**
     * Reorder pinned forum topics
     *
     * Only admins with `manageTopics` permission can do this.
     * **Available**: 👤 users only
     *
     */
    reorderPinnedForumTopics(
        params: {
        /** Chat ID or username */
            chatId: InputPeerLike

            /**
             * Order of the pinned topics
             */
            order: (number | ForumTopic)[]

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
    toggleForumTopicClosed(
        parmas: {
        /** Chat ID or username */
            chatId: InputPeerLike

            /** ID of the topic (i.e. its top message ID) */
            topicId: number | ForumTopic

            /** Whether the topic should be closed */
            closed: boolean

            /**
             * Whether to dispatch the returned service message (if any)
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message>
    /**
     * Toggle whether a topic in a forum is pinned
     *
     * Only admins with `manageTopics` permission can do this.
     * **Available**: 👤 users only
     *
     */
    toggleForumTopicPinned(
        params: {
        /** Chat ID or username */
            chatId: InputPeerLike
            /** ID of the topic (i.e. its top message ID) */
            topicId: number | ForumTopic
            /** Whether the topic should be pinned */
            pinned: boolean
        }): Promise<void>
    /**
     * Set whether a supergroup is a forum.
     *
     * Only owner of the supergroup can change this setting.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID or username
     * @param [enabled=false]  Whether the supergroup should be a forum
     * @deprecated Use {@link updateForumSettings} instead
     */
    toggleForum(chatId: InputPeerLike, enabled?: boolean): Promise<void>
    /**
     * Update forum settings of a supergroup.
     *
     * Only owner of the supergroup can change this setting.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID or username
     * @param settings  New settings. `null` is a shorthand for `{ isForum: false }`
     */
    updateForumSettings(
        chatId: InputPeerLike,
        settings: null | {
        /** Whether the supergroup should be a forum */
            isForum: boolean
            threadsMode: 'list' | 'tabs'
        }): Promise<void>
    /**
     * Toggle whether "General" topic in a forum is hidden or not
     *
     * Only admins with `manageTopics` permission can do this.
     *
     * **Available**: ✅ both users and bots
     *
     * @returns  Service message about the modification
     */
    toggleGeneralTopicHidden(
        params: {
        /** Chat ID or username */
            chatId: InputPeerLike
            /** Whether the topic should be hidden */
            hidden: boolean

            /**
             * Whether to dispatch the returned service message (if any)
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message>
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
             * Integer in range `[1, 99999]` or `Infinity`
             *
             * @default  `Infinity`
             */
            usageLimit?: number

            /**
             * Whether users to be joined via this link need to be
             * approved by an admin
             */
            withApproval?: boolean

            /**
             * When a pricing plan is passed, this link will become a paid subscription link
             *
             * Currently the only allowed `.period` is 1 month, i.e. `2592000`
             */
            subscriptionPricing?: tl.TypeStarsSubscriptionPricing
        }): Promise<ChatInviteLink>
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
    editInviteLink(
        params: {
        /** Chat ID */
            chatId: InputPeerLike
            /** Invite link to edit */
            link: string | ChatInviteLink
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
            link?: string | ChatInviteLink

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
        }): Promise<ArrayPaginated<ChatInviteLinkMember, { date: number, user: tl.TypeInputUser }>>
    /**
     * Get detailed information about an invite link
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     * @param link  The invite link
     */
    getInviteLink(
        chatId: InputPeerLike,
        link: string): Promise<ChatInviteLink>
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
        }): Promise<ArrayPaginated<ChatInviteLink, GetInviteLinksOffset>>
    /**
     * Get primary invite link of a chat
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     */
    getPrimaryInviteLink(chatId: InputPeerLike): Promise<ChatInviteLink>
    /**
     * Approve or decline multiple join requests to a chat.
     * **Available**: 👤 users only
     *
     */
    hideAllJoinRequests(
        params: {
        /** Chat/channel ID */
            chatId: InputPeerLike

            /** Whether to approve or decline the join requests */
            action: 'approve' | 'decline'

            /** Invite link to target */
            link?: string | ChatInviteLink
        }): Promise<void>
    /**
     * Approve or decline join request to a chat.
     * **Available**: ✅ both users and bots
     *
     */
    hideJoinRequest(
        params: {
        /** Chat/channel ID */
            chatId: InputPeerLike
            /** User ID */
            user: InputPeerLike
            /** Whether to approve or decline the join request */
            action: 'approve' | 'decline'
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
        }): AsyncIterableIterator<ChatInviteLinkMember>
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
             * @default  `100`
             */
            chunkSize?: number
        }): AsyncIterableIterator<ChatInviteLink>
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
    revokeInviteLink(
        chatId: InputPeerLike,
        link: string | ChatInviteLink): Promise<ChatInviteLink>
    /**
     * Append item(s) to a todo list
     *
     * @returns  Service message about the appended todo item(s), if any.
     */
    appendTodoList(
        params: InputMessageId & {
        /** Items to append */
            items: MaybeArray<InputText>

            /**
             * Whether to dispatch the new message event
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message | null>
    /**
     * Close a poll sent by you.
     *
     * Once closed, poll can't be re-opened, and nobody
     * will be able to vote in it
     * **Available**: ✅ both users and bots
     *
     */
    closePoll(
        params: InputMessageId & {
        /**
         * Whether to dispatch the edit message event
         * to the client's update handler.
         */
            shouldDispatch?: true
        }): Promise<Poll>
    /**
     * Delete messages by their IDs
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param ids  Message(s) ID(s) to delete.
     */
    deleteMessagesById(
        chatId: InputPeerLike,
        ids: number[],
        params?: DeleteMessagesParams): Promise<void>
    /**
     * Delete one or more {@link Message}
     *
     * **Available**: ✅ both users and bots
     *
     * @param messages  Message(s) to delete
     */
    deleteMessages(
        messages: Message[],
        params?: DeleteMessagesParams): Promise<void>
    /**
     * Delete scheduled messages by their IDs.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param ids  Message(s) ID(s) to delete.
     */
    deleteScheduledMessages(
        chatId: InputPeerLike,
        ids: number[]): Promise<void>
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
    editInlineMessage(
        params: {
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
            text?: InputText

            /**
             * New message media
             */
            media?: InputMediaLike

            /**
             * Whether to disable links preview in this message
             */
            disableWebPreview?: boolean

            /**
             * Whether to invert media position.
             *
             * Currently only supported for web previews and makes the
             * client render the preview above the caption and not below.
             */
            invertMedia?: boolean

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
    editMessage(
        params: InputMessageId & {
        /**
         * New message text
         *
         * When `media` is passed, `media.caption` is used instead
         */
            text?: InputText

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

            /**
             * Whether to dispatch the edit message event
             * to the client's update handler.
             */
            shouldDispatch?: true

            /**
             * Whether to invert media position.
             *
             * Currently only supported for web previews and makes the
             * client render the preview above the caption and not below.
             */
            invertMedia?: boolean

            businessConnectionId?: string
        }): Promise<Message>
    /**
     * Forward one or more messages by their IDs.
     * You can forward no more than 100 messages at once.
     *
     * **Available**: ✅ both users and bots
     *
     * @param toChatId  Destination chat ID, username, phone, `"me"` or `"self"`
     * @param fromChatId  Source chat ID, username, phone, `"me"` or `"self"`
     * @param messages  Message IDs
     * @param params  Additional sending parameters
     * @returns  Newly sent, forwarded messages in the destination chat.
     */
    forwardMessagesById(
        params: ForwardMessageOptions & {
        /** Source chat ID, username, phone, `"me"` or `"self"` */
            fromChatId: InputPeerLike
            /** Message IDs to forward */
            messages: number[]
        }): Promise<Message[]>
    /**
     * Forward one or more {@link Message}s to another chat.
     *
     * > **Note**: all messages must be from the same chat.
     * **Available**: ✅ both users and bots
     *
     */
    forwardMessages(
        params: ForwardMessageOptions & {
            messages: Message[]
        }): Promise<Message[]>
    /**
     * Get all scheduled messages in chat
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
     */
    getAllScheduledMessages(chatId: InputPeerLike): Promise<Message[]>

    /**
     * Get a list of available message effects
     * **Available**: 👤 users only
     *
     */
    getAvailableMessageEffects(): Promise<MessageEffect[]>

    /**
     * Get the message containing the button being clicked
     * in the given callback query.
     * **Available**: 🤖 bots only
     *
     */
    getCallbackQueryMessage(
        id:
          | CallbackQuery
          | tl.RawUpdateBotCallbackQuery
          | {
              messageId: number
              queryId: tl.Long
              peer: InputPeerLike
          }): Promise<Message | null>
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
    getDiscussionMessage(
        params: InputMessageId): Promise<Message | null>

    /**
     * Get fact check information for one or more messages in a chat
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat where the messages are located
     * @param msgIds  One or more message IDs
     */
    getFactCheck(
        chatId: InputPeerLike,
        msgIds: MaybeArray<number>): Promise<(FactCheck | null)[]>
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
        }): Promise<ArrayPaginated<Message, GetHistoryOffset>>
    /**
     * Given a message link (e.g. `t.me/durov/1`), fetch the relevant message.
     * **Available**: ✅ both users and bots
     *
     */
    getMessageByLink(link: string): Promise<Message | null>
    /**
     * Get all messages inside of a message group
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID
     * @param message  ID of one of the messages in the group
     */
    getMessageGroup(params: InputMessageId): Promise<Message[]>
    /**
     * Get reactions to messages by their IDs.
     *
     * > Apps should short-poll reactions for visible messages
     * > (that weren't sent by the user) once every 15-30 seconds,
     * > but only if `message.reactions` is set
     *
     * **Available**: 👤 users only
     *
     * @param chatId  ID of the chat with messages
     * @param messages  Message IDs
     * @returns  Reactions to corresponding messages, or `null` if there are none
     */
    getMessageReactionsById(
        chatId: InputPeerLike,
        messages: number[]): Promise<(MessageReactions | null)[]>
    /**
     * Get reactions to {@link Message}s.
     *
     * > **Note**: messages must all be from the same chat.
     *
     * > Apps should short-poll reactions for visible messages
     * > (that weren't sent by the user) once every 15-30 seconds,
     * > but only if `message.reactions` is set
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  ID of the chat with messages
     * @param messages  Message IDs
     * @returns  Reactions to corresponding messages, or `null` if there are none
     */
    getMessageReactions(
        messages: Message[]): Promise<(MessageReactions | null)[]>
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
     * **Available**: ✅ both users and bots
     *
     * @param messageIds  Messages IDs
     * @param [fromReply]
     *     Whether the reply to a given message should be fetched
     *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
     */
    getMessagesUnsafe(
        messageIds: MaybeArray<number>, fromReply?: boolean): Promise<(Message | null)[]>

    /**
     * Get messages in chat by their IDs
     *
     * Fot messages that were not found, `null` will be
     * returned at that position.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
     * @param messageIds  Messages IDs
     * @param [fromReply]
     *     Whether the reply to a given message should be fetched
     *     (i.e. `getMessages(msg.chat.id, msg.id, true).id === msg.replyToMessageId`)
     */
    getMessages(
        chatId: InputPeerLike,
        messageIds: MaybeArray<number>, fromReply?: boolean): Promise<(Message | null)[]>
    /**
     * Get users who have reacted to the message.
     *
     * **Available**: 👤 users only
     *
     * @param params
     */
    getReactionUsers(
        params: InputMessageId & {
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
        }): Promise<ArrayPaginated<PeerReaction, GetReactionUsersOffset>>
    /**
     * For messages containing a reply, fetch the message that is being replied.
     *
     * Note that even if a message has {@link replyToMessage},
     * the message itself may have been deleted, in which case
     * this method will also return `null`.
     * **Available**: ✅ both users and bots
     *
     */
    getReplyTo(message: Message): Promise<Message | null>
    /**
     * Get scheduled messages in chat by their IDs
     *
     * Fot messages that were not found, `null` will be
     * returned at that position.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`
     * @param messageIds  Scheduled messages IDs
     */
    getScheduledMessages(
        chatId: InputPeerLike,
        messageIds: MaybeArray<number>): Promise<(Message | null)[]>
    /**
     * Get a preview of a web page contained in the message
     *
     * **Available**: 👤 users only
     *
     * @param text  Text of the message, or simply the link for which the preview should be retrieved
     */
    getWebPagePreview(
        text: InputText): Promise<WebPageMedia | null>
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
        }): AsyncIterableIterator<Message>
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
        params: Parameters<typeof getReactionUsers>[1] & {
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
        }): AsyncIterableIterator<PeerReaction>
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
        }): AsyncIterableIterator<Message>
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
        }): AsyncIterableIterator<Message>
    /**
     * Pin a message in a group, supergroup, channel or PM.
     *
     * For supergroups/channels, you must have appropriate permissions,
     * either as an admin, or as default permissions
     *
     * **Available**: ✅ both users and bots
     *
     * @returns  Service message about pinned message, if one was generated.
     */
    pinMessage(
        params: InputMessageId & {
        /** Whether to send a notification (only for legacy groups and supergroups) */
            notify?: boolean
            /** Whether to pin for both sides (only for private chats) */
            bothSides?: boolean

            /**
             * Whether to dispatch the returned service message (if any)
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message | null>
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

            /**
             * Whether to dispatch updates that will be generated by this call.
             * Doesn't follow `disableNoDispatch`
             */
            shouldDispatch?: true
        }): Promise<void>
    /**
     * Mark all reactions in chat as read.
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat ID
     */
    readReactions(
        chatId: InputPeerLike,
        params?: {
        /**
         * Whether to dispatch updates that will be generated by this call.
         * Doesn't follow `disableNoDispatch`
         */
            shouldDispatch?: true
        }): Promise<void>
    /**
     * Search for messages globally from all of your chats
     *
     * **Note**: Due to Telegram limitations, you can only get up to ~10000 messages
     *
     * **Available**: 👤 users only
     *
     * @param params  Search parameters
     */
    searchGlobal(
        params?: {
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
             * Filter the results using some filter. (see {@link SearchFilters})
             *
             * @default  {@link SearchFilters.Empty} (i.e. will return all messages)
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

            /**
             * Whether to only search across broadcast channels
             */
            onlyChannels?: boolean
        }): Promise<ArrayPaginated<Message, SearchGlobalOffset>>

    /**
     * Perform a global hashtag search, across the entire Telegram
     *
     * **Available**: 👤 users only
     *
     * @param hashtag  Hashtag to search for
     * @param params  Additional parameters
     */
    searchHashtag(
        hashtag: string,
        params?: {
        /** Offset for the search */
            offset?: SearchHashtagOffset
            /** Limit the number of results */
            limit?: number
        }): Promise<ArrayPaginated<Message, SearchHashtagOffset>>
    /**
     * Perform a global hashtag search, across the entire Telegram
     *
     * Iterable version of {@link searchHashtag}
     *
     * **Available**: ✅ both users and bots
     *
     * @param hashtag  Hashtag to search for
     * @param params  Additional parameters
     */
    iterSearchHashtag(
        hashtag: string,
        params?: Parameters<typeof searchHashtag>[2] & {
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
        }): AsyncIterableIterator<Message>
    /**
     * Search for messages inside a specific chat
     *
     * **Available**: 👤 users only
     *
     * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
     * @param params  Additional search parameters
     */
    searchMessages(
        params?: {
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
             * @default  `0` (disabled).
             */
            minDate?: number | Date

            /**
             * Maximum message date to return
             *
             * @default  `0` (disabled).
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
             * Filter the results using some filter (see {@link SearchFilters})
             *
             * @default  {@link SearchFilters.Empty} (i.e. will return all messages)
             */
            filter?: tl.TypeMessagesFilter

            /**
             * Search only for messages sent by a specific user.
             *
             * You can pass their marked ID, username, phone or `"me"` or `"self"`
             */
            fromUser?: InputPeerLike
        }): Promise<ArrayPaginated<Message, SearchMessagesOffset>>
    /** Send a text to the same chat (and topic, if applicable) as a given message */
    answerText(
        message: Message,
        ...params: ParametersSkip2<typeof sendText>): ReturnType<typeof sendText>
    /** Send a media to the same chat (and topic, if applicable) as a given message */
    answerMedia(
        message: Message,
        ...params: ParametersSkip2<typeof sendMedia>): ReturnType<typeof sendMedia>
    /** Send a media group to the same chat (and topic, if applicable) as a given message */
    answerMediaGroup(
        message: Message,
        ...params: ParametersSkip2<typeof sendMediaGroup>): ReturnType<typeof sendMediaGroup>
    /**
     * Send a text comment to a given message.
     *
     * If this is a normal message (not a channel post),
     * a simple reply will be sent.
     *
     * **Available**: ✅ both users and bots
     *
     * @throws MtArgumentError
     *     If this is a channel post which does not have comments section.
     *     To check if a post has comments, use {@link Message#replies}.hasComments
     */
    commentText(
        message: Message,
        ...params: ParametersSkip2<typeof sendText>): ReturnType<typeof sendText>
    /**
     * Send a text comment to a given message.
     *
     * If this is a normal message (not a channel post),
     * a simple reply will be sent.
     *
     * **Available**: ✅ both users and bots
     *
     * @throws MtArgumentError
     *     If this is a channel post which does not have comments section.
     *     To check if a post has comments, use {@link Message#replies}.hasComments
     */
    commentMedia(
        message: Message,
        ...params: ParametersSkip2<typeof sendMedia>): ReturnType<typeof sendMedia>
    /**
     * Send a text comment to a given message.
     *
     * If this is a normal message (not a channel post),
     * a simple reply will be sent.
     *
     * **Available**: ✅ both users and bots
     *
     * @throws MtArgumentError
     *     If this is a channel post which does not have comments section.
     *     To check if a post has comments, use {@link Message#replies}.hasComments
     */
    commentMediaGroup(
        message: Message,
        ...params: ParametersSkip2<typeof sendMediaGroup>): ReturnType<typeof sendMediaGroup>
    /**
     * Copy a message group (i.e. send the same message group, but do not forward it).
     *
     * Note that all the provided messages must be in the same message group
     * **Available**: ✅ both users and bots
     *
     */
    sendCopyGroup(
        params: SendCopyGroupParams &
          (
            | {
            /** Source chat ID */
                fromChatId: InputPeerLike
                /** Message IDs to forward */
                messages: number[]
            }
            | { messages: Message[] }
        )): Promise<Message[]>
    /**
     * Copy a message (i.e. send the same message, but do not forward it).
     *
     * Note that if the message contains a webpage,
     * it will be copied simply as a text message,
     * and if the message contains an invoice,
     * it can't be copied.
     * **Available**: ✅ both users and bots
     *
     */
    sendCopy(
        params: SendCopyParams &
          (
            | {
            /** Source chat ID */
                fromChatId: InputPeerLike
                /** Message ID to forward */
                message: number
            }
            | { message: Message }
        )): Promise<Message>
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
        params?: CommonSendParams & {
        /**
         * Whether to invert media position.
         *
         * Currently only supported for web previews and makes the
         * client render the preview above the caption and not below.
         */
            invertMedia?: boolean

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
        }): Promise<Message[]>
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
        params?: CommonSendParams & {
        /**
         * For bots: inline or reply markup or an instruction
         * to hide a reply keyboard or to force a reply.
         */
            replyMarkup?: ReplyMarkup

            /**
             * Whether to invert media position.
             *
             * Currently only supported for web previews and makes the
             * client render the preview above the caption and not below.
             */
            invert?: boolean

            /**
             * Override caption for `media`.
             *
             * Can be used, for example. when using File IDs
             * or when using existing InputMedia objects.
             */
            caption?: InputText

            /**
             * Function that will be called after some part has been uploaded.
             * Only used when a file that requires uploading is passed,
             * and not used when uploading a thumbnail.
             *
             * @param uploaded  Number of bytes already uploaded
             * @param total  Total file size
             */
            progressCallback?: (uploaded: number, total: number) => void
        }): Promise<Message>

    /**
     * Send a paid reaction using Telegram Stars.
     *
     * **Available**: 👤 users only
     *
     * @returns
     *   Message to which the reaction was sent, if available.
     *   The message is normally available for users, but may not be available for bots in PMs.
     */
    sendPaidReaction(
        params: InputMessageId & {
        /**
         * Whether to send the reaction anonymously
         */
            anonymous?: boolean

            /**
             * Peer as which to send the reaction, mutually exclusive with `anonymous`
             */
            asPeer?: InputPeerLike

            /**
             * Number of reactions to send
             *
             * @default  1
             */
            count?: number

            /**
             * Whether to dispatch the returned edit message event
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<MessageReactions>
    /** Send a text in reply to a given quote */
    quoteWithText(
        message: Message,
        params: QuoteParamsFrom<Parameters<typeof sendText>[3]> & {
        /** Text to send */
            text: Parameters<typeof sendText>[2]
        }): ReturnType<typeof sendText>
    /** Send a media in reply to a given quote */
    quoteWithMedia(
        message: Message,
        params: QuoteParamsFrom<Parameters<typeof sendMedia>[3]> & {
        /** Media to send */
            media: Parameters<typeof sendMedia>[2]
        }): ReturnType<typeof sendMedia>
    /** Send a media group in reply to a given quote */
    quoteWithMediaGroup(
        message: Message,
        params: QuoteParamsFrom<Parameters<typeof sendMediaGroup>[3]> & {
        /** Media group to send */
            medias: Parameters<typeof sendMediaGroup>[2]
        }): ReturnType<typeof sendMediaGroup>
    /**
     * Send or remove a reaction.
     *
     * **Available**: 👤 users only
     *
     * @returns
     *   Message to which the reaction was sent, if available.
     *   The message is normally available for users, but may not be available for bots in PMs.
     */
    sendReaction(
        params: InputMessageId & {
        /** Reaction emoji (or `null` to remove reaction) */
            emoji?: MaybeArray<InputReaction> | null
            /** Whether to use a big reaction */
            big?: boolean

            /**
             * Whether to dispatch the returned edit message event
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message | null>
    /** Send a text in reply to a given message */
    replyText(
        message: Message,
        ...params: ParametersSkip2<typeof sendText>): ReturnType<typeof sendText>
    /** Send a media in reply to a given message */
    replyMedia(
        message: Message,
        ...params: ParametersSkip2<typeof sendMedia>): ReturnType<typeof sendMedia>
    /** Send a media group in reply to a given message */
    replyMediaGroup(
        message: Message,
        ...params: ParametersSkip2<typeof sendMediaGroup>): ReturnType<typeof sendMediaGroup>
    /**
     * Send previously scheduled message(s)
     *
     * Note that if the message belongs to a media group,
     * the entire group will be sent, and all the messages
     * will be returned.
     *
     * **Available**: 👤 users only
     *
     * @param peer  Chat where the messages were scheduled
     * @param ids  ID(s) of the messages
     */
    sendScheduled(
        peer: InputPeerLike,
        ids: MaybeArray<number>): Promise<Message[]>
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
        text: InputText,
        params?: CommonSendParams & {
        /**
         * For bots: inline or reply markup or an instruction
         * to hide a reply keyboard or to force a reply.
         */
            replyMarkup?: ReplyMarkup

            /**
             * Whether to disable links preview in this message
             */
            disableWebPreview?: boolean

            /**
             * Whether to invert media position.
             *
             * Currently only supported for web previews and makes the
             * client render the preview above the caption and not below.
             */
            invertMedia?: boolean
        }): Promise<Message>
    /**
     * Sends a current user/bot typing event
     * to a conversation partner or group.
     *
     * This status is set for 6 seconds, and is
     * automatically cancelled if you send a
     * message.
     *
     * If you need a continuous typing status, use {@link setTyping} instead.
     *
     * **Available**: ✅ both users and bots
     *
     * @param chatId  Chat ID
     * @param [status='typing']  Typing status
     * @param params
     */
    sendTyping(
        chatId: InputPeerLike, status?: Exclude<TypingStatus, 'interaction' | 'interaction_seen'> | tl.TypeSendMessageAction,
        params?: {
        /**
         * For `upload_*` and history import actions, progress of the upload
         */
            progress?: number

            /**
             * Unique identifier of the business connection on behalf of which the action will be sent
             */
            businessConnectionId?: string

            /**
             * For comment threads, ID of the thread (i.e. top message)
             */
            threadId?: number
        }): Promise<void>
    /**
     * Send or retract a vote in a poll.
     * **Available**: 👤 users only
     *
     */
    sendVote(
        params: InputMessageId & {
        /**
         * Selected options, or `null` to retract.
         * You can pass indexes of the answers or the `Buffer`s
         * representing them. In case of indexes, the poll will first
         * be requested from the server.
         */
            options: null | MaybeArray<number | Uint8Array>
        }): Promise<Poll>
    /**
     * Sets whether a user is typing in a specific chat
     *
     * This status is automatically renewed by mtcute until a further
     * call with `cancel` is made, or a message is sent to the chat.
     * **Available**: ✅ both users and bots
     *
     */
    setTyping(
        params: {
        /** Chat ID where the user is currently typing */
            peerId: InputPeerLike

            /**
             * Typing status to send
             *
             * @default  `typing`
             */
            status?: Exclude<TypingStatus, 'interaction' | 'interaction_seen'> | tl.TypeSendMessageAction

            /**
             * For `upload_*` and history import actions, progress of the upload
             */
            progress?: number

            /**
             * Unique identifier of the business connection on behalf of which the action will be sent
             */
            businessConnectionId?: string

            /**
             * For comment threads, ID of the thread (i.e. top message)
             */
            threadId?: number
        }): Promise<void>
    /**
     * Toggle the completion status of a todo list item(s)
     *
     * @returns  Service message about the toggled items, if any.
     */
    toggleTodoCompleted(
        params: InputMessageId & {
        /** Items to mark as completed */
            completed: MaybeArray<number>
            /** Items to mark as uncompleted */
            uncompleted: MaybeArray<number>

            /**
             * Whether to dispatch the new message event
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message | null>
    /**
     * Translate message text to a given language.
     *
     * Returns `null` if it could not translate the message.
     * **Available**: 👤 users only
     *
     */
    translateMessage(
        params: InputMessageId & {
        /** Target language (two-letter ISO 639-1 language code) */
            toLanguage: string
        }): Promise<TextWithEntities>
    /**
     * Translate text to a given language.
     *
     * **Available**: 👤 users only
     *
     * @param text  Text to translate
     * @param toLanguage  Target language (two-letter ISO 639-1 language code)
     */
    translateText(
        text: InputText,
        toLanguage: string): Promise<TextWithEntities>
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

            /**
             * Whether to dispatch updates that will be generated by this call.
             * Doesn't follow `disableNoDispatch`
             */
            shouldDispatch?: true
        }): Promise<void>
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
    unpinMessage(params: InputMessageId): Promise<void>

    /**
     * Get information about a fragment collectible
     * **Available**: 👤 users only
     *
     */
    getCollectibleInfo(
        kind: 'phone' | 'username',
        item: string): Promise<CollectibleInfo>
    /**
     * Create a new takeout session
     *
     * **Available**: 👤 users only
     *
     * @param params  Takeout session parameters
     */
    initTakeoutSession(
        params: Omit<tl.account.RawInitTakeoutSessionRequest, '_'>): Promise<TakeoutSession>
    /**
     * Normalize {@link InputPrivacyRule}[] to `tl.TypeInputPrivacyRule`,
     * resolving the peers if needed.
     * **Available**: ✅ both users and bots
     *
     */
    _normalizePrivacyRules(
        rules: InputPrivacyRule[]): Promise<tl.TypeInputPrivacyRule[]>
    /**
     * Change your 2FA password
     * **Available**: 👤 users only
     *
     */
    changeCloudPassword(
        params: {
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
    enableCloudPassword(
        params: {
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

    _normalizeInputStarGift(
        gift: InputStarGift): Promise<tl.TypeInputSavedStarGift>

    /**
     * Accept, hide or convert a star gift.
     *
     * **Available**: 👤 users only
     *
     * @returns  Whether the action was successful
     */
    acceptStarGift(
        params: {
        /** Input star gift to accept */
            gift: InputStarGift

            /**
             * Action to perform on the gift.
             *  - `save` - save the gift to your profile
             *  - `hide` - hide the gift from your profile
             *  - `convert` - convert the gift to stars (can't be undone)
             */
            action: 'save' | 'hide' | 'convert'
        }): Promise<boolean>
    /**
     * Boost a given channel
     *
     * **Available**: 👤 users only
     *
     * @param peerId  Peer ID to boost
     */
    applyBoost(peerId: InputPeerLike): Promise<void>

    buyResaleGift(
        params: {
        /** Slug of the star gift to buy */
            slug: string

            /** ID of the user to buy the gift for */
            recipient: InputPeerLike

            /**
             * Whether to dispatch the new message event
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message | null>
    /**
     * Check if the current user can apply boost to some channel
     *
     * **Available**: ✅ both users and bots
     *
     * @returns
     *   - `{ can: true }` if the user can apply boost
     *      - `.replace` - {@link Chat}s that can be replaced with the current one.
     *        If the user can apply boost without replacing any chats, this field will be `undefined`.
     *   - `{ can: false }` if the user can't apply boost
     *      - `.reason == "no_slots"` if the user has no available slots
     *      - `.reason == "need_premium"` if the user needs Premium to boost
     *   - In all cases, `slots` will contain all the current user's boost slots
     */
    canApplyBoost(): Promise<CanApplyBoostResult>

    /**
     * Create a new business chat link
     *
     * **Available**: 👤 users only
     *
     * @param text  Text to be inserted into the message input
     */
    createBusinessChatLink(
        text: InputText,
        params?: {
        /** Custom title for the link */
            title?: string
        }): Promise<BusinessChatLink>

    /**
     * Edit an existing business chat link
     *
     * **Available**: 👤 users only
     *
     * @param link  The link to edit
     */
    editBusinessChatLink(
        link: string | BusinessChatLink,
        params: {
        /** Text to be inserted in the message input */
            text: InputText
            /** Custom title for the link */
            title?: string
        }): Promise<BusinessChatLink>

    /**
     * Delete a business chat link
     *
     * **Available**: 👤 users only
     *
     * @param link  The link to delete
     */
    deleteBusinessChatLink(link: string | BusinessChatLink): Promise<void>

    /**
     * Get information about boosts in a channel
     *
     * **Available**: 👤 users only
     *
     * @returns  IDs of stories that were removed
     */
    getBoostStats(peerId: InputPeerLike): Promise<BoostStats>
    /**
     * Get boosts of a channel
     * **Available**: 👤 users only
     *
     */
    getBoosts(
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
        }): Promise<ArrayPaginated<Boost, string>>

    /**
     * Get current user's business chat links
     * **Available**: 👤 users only
     *
     */
    getBusinessChatLinks(): Promise<BusinessChatLink[]>

    /**
     * Get information about the connection of the bot with a business account
     *
     * **Available**: 🤖 bots only
     *
     * @param connectionId  ID of the business connection
     */
    getBusinessConnection(
        connectionId: string): Promise<BusinessConnection>
    /**
     * Get boost slots information of the current user.
     *
     * Includes information about the currently boosted channels,
     * as well as the slots that can be used to boost other channels.
     * **Available**: 👤 users only
     *
     */
    getMyBoostSlots(): Promise<BoostSlot[]>
    /**
     * Get a list of star gifts up for resale
     */
    getResaleOptions(
        params: {
        /** ID of the gift to get resale options for */
            giftId: tl.Long

            /**
             * Sorting attribute
             *
             * - `price`: Sort by price
             * - `num`: Sort by its unique number
             */
            sort?: 'price' | 'num'

            /**
             * Hash of the `attributes` field, as returned by the server in the first response
             */
            attributesHash?: Long

            /** Attributes to filter for */
            attributes?: tl.TypeStarGiftAttributeId[] | InputStarGiftAttributeIds

            /** Offset for pagination */
            offset?: string
            /** Limit for pagination */
            limit?: number
        }): Promise<ArrayPaginatedWithMeta<StarGiftUnique, string, ResaleStarGiftsMeta>>
    /** Get one or more saved star gifts by their IDs */
    getSavedStarGiftsById(
        gifts: MaybeArray<InputStarGift>): Promise<SavedStarGift[]>
    /**
     * Get a list of saved star gifts of a user/channel
     *
     * Note that filters currently only work for channels
     */
    getSavedStarGifts(
        params: {
        /** Peer to get saved gifts from */
            owner: InputPeerLike

            /** Whether to exclude hidden gifts */
            excludeHidden?: boolean
            /** Whether to exclude publicly visible gifts */
            excludePublic?: boolean
            /** Whether to exclude gifts with unlimited availability */
            excludeUnlimited?: boolean
            /** Whether to exclude gifts with limited availability */
            excludeLimited?: boolean
            /** Whether to exclude unique gifts */
            excludeUnique?: boolean

            /** Whether to sort by value */
            sortByValue?: boolean

            /** Offset for pagination */
            offset?: string
            /** Limit for pagination */
            limit?: number
        }): Promise<ArrayPaginated<SavedStarGift, string>>

    /**
     * Get the list of available star gifts.
     * **Available**: 👤 users only
     *
     */
    getStarGiftOptions(): Promise<StarGift[]>

    getStarGiftWithdrawalUrl(
        params: {
        /** The star gift to withdraw */
            gift: InputStarGift

            /** 2FA password */
            password: string
        }): Promise<string>
    /**
     * Get Telegram Stars transactions for a given peer.
     *
     * You can either pass `self` to get your own transactions,
     * or a chat/bot ID to get transactions of that peer.
     *
     * **Available**: ✅ both users and bots
     *
     * @param peerId  Peer ID
     * @param params  Additional parameters
     */
    getStarsTransactions(
        peerId: InputPeerLike,
        params?: {
        /**
         * If passed, only transactions of this direction will be returned
         */
            direction?: 'incoming' | 'outgoing'
            /**
             * Direction to sort transactions date by (default: desc)
             */
            sort?: 'asc' | 'desc'
            /**
             * If passed, will only return transactions related to  this subscription ID
             */
            subscriptionId?: string
            /** Pagination offset */
            offset?: string
            /**
             * Pagination limit
             *
             * @default  100
             */
            limit?: number
        }): Promise<StarsStatus>
    /**
     * Get information about a unique star gift by its slug
     */
    getUniqueStarGift(
        slug: string): Promise<StarGiftUnique>
    /**
     * Iterate over boosters of a channel.
     *
     * Wrapper over {@link getBoosters}
     * **Available**: ✅ both users and bots
     *
     */
    iterBoosters(
        peerId: InputPeerLike,
        params?: Parameters<typeof getBoosts>[2] & {
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
        }): AsyncIterableIterator<Boost>
    /**
     * Iterate over saved star gifts of a user,
     * wrapper over {@link getSavedStarGifts}
     */
    iterSavedStarGifts(
        params: {
        /** Peer to get saved gifts from */
            owner: InputPeerLike

            /** Whether to exclude unsaved gifts */
            excludeUnsaved?: boolean
            /** Whether to exclude saved gifts */
            excludeSaved?: boolean
            /** Whether to exclude gifts with unlimited availability */
            excludeUnlimited?: boolean
            /** Whether to exclude gifts with limited availability */
            excludeLimited?: boolean
            /** Whether to exclude unique gifts */
            excludeUnique?: boolean

            /** Whether to sort by value */
            sortByValue?: boolean

            /** Offset for pagination */
            offset?: string
            /** Limit for pagination */
            limit?: number
        }): AsyncIterableIterator<SavedStarGift>
    /**
     * Iterate over Telegram Stars transactions for a given peer.
     *
     * You can either pass `self` to get your own transactions,
     * or a chat/bot ID to get transactions of that peer.
     *
     * Wrapper over {@link getStarsTransactions}
     *
     * **Available**: ✅ both users and bots
     *
     * @param peerId  Peer ID
     * @param params  Additional parameters
     */
    iterStarsTransactions(
        peerId: InputPeerLike,
        params?: Parameters<typeof getStarsTransactions>[2] & {
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
        }): AsyncIterableIterator<StarsTransaction>
    /**
     * Toggles whether one or more star gift is pinned to the top of the list
     */
    togglePinnedStarGifts(
        params: {
        /** One or more gifts to pin */
            gifts: MaybeArray<InputStarGift>
            /** Peer where the gift is sent */
            peer: InputPeerLike
        }): Promise<void>
    /**
     * Send a star gift to a user.
     *
     * > **Note**: this method is not indended to be used by full-fledged clients,
     * > as this method hides the actual invoice and payment form from the user.
     * > For GUI clients, you should refer to the method's source code and
     * > present the payment form to the user.
     *
     * **Available**: 👤 users only
     *
     * @returns  Service message about the sent gift, if one was generated.
     */
    sendStarGift(
        params: {
        /** ID of the peer to send the gift to */
            peerId: InputPeerLike

            /** ID of the gift to send */
            gift: Long | StarGift

            /**
             * Whether to send the gift anonymously
             * (i.e. if the recipient chooses to display the gift
             * on their profile, your name won't be visible)
             */
            anonymous?: boolean

            /** Message to send along with the gift */
            message?: InputText

            /** Whether to automatically upgrade the gift to a unique star gift */
            withUpgrade?: boolean

            /**
             * Whether to dispatch the new message event
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message | null>

    /**
     * Set current user's business introduction.
     *
     * **Available**: 👤 users only
     *
     * @param intro  Introduction parameters, or `null` to remove
     */
    setBusinessIntro(
        intro: {
        /**
         * Title of the introduction
         */
            title?: string

            /**
             * Description of the introduction
             */
            description?: string

            /**
             * Sticker to show beneath the introduction
             */
            sticker?: InputMediaSticker | InputFileLike | tl.TypeInputDocument
        } | null): Promise<void>

    /**
     * Set current user's business work hours.
     * **Available**: 👤 users only
     *
     */
    setBusinessWorkHours(
        params:
        | ({
            /** Timezone in which the hours are defined */
            timezone: string
        } & (
          | {
              /**
               * Business work intervals, per-day (like available in {@link BusinessWorkHours.days})
               */
              hours: ReadonlyArray<BusinessWorkHoursDay>
          }
          | {
              /** Business work intervals, raw intervals */
              intervals: tl.TypeBusinessWeeklyOpen[]
          }
          ))
          | null): Promise<void>
    /** Set resale price for an owned star gift */
    setResaleStarGiftPrice(
        params: {
        /** Star gift to update the price of */
            gift: InputStarGift

            /** New price of the gift (in stars), or `null` to unlist */
            price: number | null
        }): Promise<void>
    /**
     * Transfer a unique star gift.
     *
     * > **Note**: this method is not indended to be used by full-fledged clients,
     * > as this method hides the actual invoice and payment form from the user.
     * > For GUI clients, you should refer to the method's source code and
     * > present the payment form to the user.
     *
     * @returns  Service message about the transferred gift, if one was generated.
     */
    transferStarGift(
        params: {
        /** Star gift to transfer */
            gift: InputStarGift

            /** ID of the user to transfer the gift to */
            recipient: InputPeerLike

            /**
             * Whether to dispatch the new message event
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message | null>
    /**
     * Upgrades a star gift to a unique gift.
     *
     * > **Note**: this method is not indended to be used by full-fledged clients,
     * > as this method hides the actual invoice and payment form from the user.
     * > For GUI clients, you should refer to the method's source code and
     * > present the payment form to the user.
     *
     * @returns  Service message about the upgraded gift, if one was generated.
     */
    upgradeStarGift(
        params: {
            gift: InputStarGift

            /**
             * Whether to retain the original details of the gift
             * (like sender, recipient, date, message)
             */
            keepOriginalDetails?: boolean

            /**
             * Whether to dispatch the new message event
             * to the client's update handler.
             */
            shouldDispatch?: true
        }): Promise<Message | null>
    /**
     * Add a sticker to a sticker set.
     *
     * For bots the sticker set must have been created by this bot.
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
        }): Promise<StickerSet>
    /**
     * Create a new sticker set.
     *
     * **Available**: ✅ both users and bots
     *
     * @param params
     * @returns  Newly created sticker set
     */
    createStickerSet(
        params: {
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
             *
             * @default  `sticker`, i.e. regular stickers.
             */
            type?: StickerType

            /**
             * Whether to create "adaptive" emoji set.
             *
             * Color of the emoji will be changed depending on the text color.
             * Only works for TGS-based emoji stickers
             */
            adaptive?: boolean

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
     * For bots the sticker set must have been created by this bot.
     *
     * **Available**: ✅ both users and bots
     *
     * @param sticker
     *     TDLib and Bot API compatible File ID, or a
     *     TL object representing a sticker to be removed
     * @returns  Modfiied sticker set
     */
    deleteStickerFromSet(
        sticker: string | tdFileId.RawFullRemoteFileLocation | tl.TypeInputDocument): Promise<StickerSet>
    /**
     * Get custom emoji stickers by their IDs
     *
     * **Available**: ✅ both users and bots
     *
     * @param ids  IDs of the stickers (as defined in {@link MessageEntity.emojiId})
     */
    getCustomEmojis(ids: tl.Long[]): Promise<Sticker[]>
    /**
     * Given one or more messages, extract all unique custom emojis from it and fetch them
     * **Available**: ✅ both users and bots
     *
     */
    getCustomEmojisFromMessages(
        messages: MaybeArray<Message>): Promise<Sticker[]>
    /**
     * Get a list of all installed sticker packs
     *
     * > **Note**: This method returns *brief* meta information about
     * > the packs, that does not include the stickers themselves.
     * > Use {@link getStickerSet} to get a stickerset that will include the stickers
     * **Available**: 👤 users only
     *
     */
    getInstalledStickers(): Promise<StickerSet[]>

    /**
     * Get the list of sticker sets that were created by the current user
     * **Available**: 👤 users only
     *
     */
    getMyStickerSets(
        params?: {
        /** Offset for pagination */
            offset?: Long
            /** Limit for pagination */
            limit?: number
        }): Promise<ArrayPaginated<StickerSet, Long>>
    /**
     * Get a sticker set and stickers inside of it.
     *
     * **Available**: ✅ both users and bots
     *
     * @param setId  Sticker set identifier
     */
    getStickerSet(setId: InputStickerSet): Promise<StickerSet>
    /**
     * Move a sticker in a sticker set
     * to another position
     *
     * For bots the sticker set must have been created by this bot.
     *
     * **Available**: ✅ both users and bots
     *
     * @param sticker
     *     TDLib and Bot API compatible File ID, or a
     *     TL object representing a sticker to be removed
     * @param position  New sticker position (starting from 0)
     * @returns  Modified sticker set
     */
    moveStickerInSet(
        sticker: string | tdFileId.RawFullRemoteFileLocation | tl.TypeInputDocument,
        position: number): Promise<StickerSet>

    /**
     * Replace a sticker in a sticker set with another sticker
     *
     * For bots the sticker set must have been created by this bot.
     *
     * **Available**: ✅ both users and bots
     *
     * @param sticker
     *     TDLib and Bot API compatible File ID, or a
     *     TL object representing a sticker to be removed
     * @param newSticker  New sticker to replace the old one with
     * @returns  Modfiied sticker set
     */
    replaceStickerInSet(
        sticker: string | tdFileId.RawFullRemoteFileLocation | tl.TypeInputDocument,
        newSticker: InputStickerSetItem,
        params?: {
        /**
         * Upload progress callback
         *
         * @param uploaded  Number of bytes uploaded
         * @param total  Total file size
         */
            progressCallback?: (uploaded: number, total: number) => void
        }): Promise<StickerSet>
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
    setChatStickerSet(
        chatId: InputPeerLike,
        setId: InputStickerSet): Promise<void>
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
        }): Promise<StickerSet>
    /**
     * Check if the current user can post stories as a given peer
     *
     * **Available**: 👤 users only
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
     * **Available**: 👤 users only
     *
     * @returns  IDs of stories that were removed
     */
    deleteStories(
        params: {
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
     * **Available**: 👤 users only
     *
     * @returns  Edited story
     */
    editStory(
        params: {
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
            caption?: InputText

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
    /**
     * Get all stories (e.g. to load the top bar)
     * **Available**: 👤 users only
     *
     */
    getAllStories(
        params?: {
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
     * Get stories of a given peer
     *
     * **Available**: 👤 users only
     *
     * @param peerId  Peer ID whose stories to fetch
     */
    getPeerStories(peerId: InputPeerLike): Promise<PeerStories>
    /**
     * Get profile stories
     * **Available**: 👤 users only
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
        }): Promise<ArrayPaginated<Story, number>>
    /**
     * Get one or more stories by their IDs
     *
     * **Available**: 👤 users only
     *
     * @param peerId  Peer ID whose stories to fetch
     * @param storyIds  Story IDs
     */
    getStoriesById(
        peerId: InputPeerLike,
        storyIds: MaybeArray<number>): Promise<Story[]>
    /**
     * Get brief information about stories interactions.
     *
     * The result will be in the same order as the input IDs
     * **Available**: 👤 users only
     *
     */
    getStoriesInteractions(
        peerId: InputPeerLike,
        storyIds: MaybeArray<number>): Promise<StoryInteractions[]>
    /**
     * Generate a link to a story.
     *
     * Basically the link format is `t.me/<username>/s/<story_id>`,
     * and if the user doesn't have a username, `USER_PUBLIC_MISSING` is thrown.
     *
     * I have no idea why is this an RPC call, but whatever
     * **Available**: 👤 users only
     *
     */
    getStoryLink(
        peerId: InputPeerLike,
        storyId: number): Promise<string>
    /**
     * Get viewers list of a story
     * **Available**: 👤 users only
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
        }): Promise<StoryViewersList>
    /**
     * Hide own stories views (activate so called "stealth mode")
     *
     * Currently has a cooldown of 1 hour, and throws FLOOD_WAIT error if it is on cooldown.
     * **Available**: 👤 users only
     *
     */
    hideMyStoriesViews(
        params?: {
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
     * **Available**: 👤 users only
     *
     * @param peerId  Peer ID whose stories to mark as read
     * @param ids  ID(s) of the stories to increment views of (max 200)
     */
    incrementStoriesViews(
        peerId: InputPeerLike,
        ids: MaybeArray<number>): Promise<void>
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
        }): AsyncIterableIterator<PeerStories>
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
        }): AsyncIterableIterator<Story>
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
        }): AsyncIterableIterator<StoryViewer>
    /**
     * Mark all stories up to a given ID as read
     *
     * This should only be used for "active" stories ({@link Story#isActive} == false)
     *
     * **Available**: 👤 users only
     *
     * @param peerId  Peer ID whose stories to mark as read
     * @returns  IDs of the stores that were marked as read
     */
    readStories(peerId: InputPeerLike, maxId: number): Promise<number[]>
    /**
     * Send (or remove) a reaction to a story
     * **Available**: 👤 users only
     *
     */
    sendStoryReaction(
        params: {
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
     * **Available**: 👤 users only
     *
     * @returns  Created story
     */
    sendStory(
        params: {
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
            caption?: InputText

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
     * **Available**: 👤 users only
     *
     */
    togglePeerStoriesArchived(
        peerId: InputPeerLike,
        archived: boolean): Promise<void>
    /**
     * Toggle one or more stories pinned status
     *
     * **Available**: 👤 users only
     *
     * @returns  IDs of stories that were toggled
     */
    toggleStoriesPinned(
        params: {
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
    deleteProfilePhotos(
        ids: MaybeArray<string | tl.TypeInputPhoto>): Promise<void>
    /**
     * Edit "close friends" list directly using user IDs
     *
     * **Available**: 👤 users only
     *
     * @param ids  User IDs
     */
    editCloseFriendsRaw(ids: number[]): Promise<void>
    /**
     * Edit "close friends" list using `InputPeerLike`s
     *
     * **Available**: 👤 users only
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
     * **Available**: 👤 users only
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
    getMyUsername(): Promise<string | null>
    /** Get {@link PeerSettings} for a peer */
    getPeerSettings(
        peerId: InputPeerLike): Promise<PeerSettings>
    /**
     * Get a single profile picture of a user by its ID
     *
     * **Available**: ✅ both users and bots
     *
     * @param userId  User ID, username, phone number, `"me"` or `"self"`
     * @param photoId  ID of the photo to fetch
     * @param params
     */
    getProfilePhoto(
        userId: InputPeerLike,
        photoId: tl.Long): Promise<Photo>
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
        }): Promise<ArrayPaginated<Photo, number>>
    /**
     * Get information about multiple users.
     * You can retrieve up to 200 users at once.
     *
     * Note that order is not guaranteed.
     *
     * **Available**: ✅ both users and bots
     *
     * @param ids  Users' identifiers. Can be ID, username, phone number, `"me"`, `"self"` or TL object
     */
    getUsers(ids: MaybeArray<InputPeerLike>): Promise<(User | null)[]>
    /**
     * Check whether a given peer ID can be used to actually
     * interact with the Telegram API.
     * This method checks the internal peers cache for the given
     * input peer, and returns `true` if it is available there.
     *
     * You can think of this method as a stripped down version of
     * {@link resolvePeer}, which only returns `true` or `false`.
     *
     * > **Note:** This method works offline and never sends any requests.
     * > This means that when passing a username or phone number, it will
     * > only return `true` if the user with that username/phone number
     * > is cached in the storage, and will not try to resolve the peer by calling the API,
     * > which *may* lead to false negatives.
     *
     * **Available**: ✅ both users and bots
     *
     * @returns
     */
    isPeerAvailable(
        peerId: InputPeerLike): Promise<boolean>
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
        }): AsyncIterableIterator<Photo>
    /**
     * Get multiple `InputPeer`s at once,
     * while also normalizing and removing
     * peers that can't be normalized to that type.
     *
     * If a peer was not found, it will be skipped.
     *
     * Uses async pool internally, with a concurrent limit of 8
     *
     * @param peerIds  Peer Ids
     * @param normalizer  Normalization function
     */
    resolvePeerMany<T extends tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel>(
        peerIds: InputPeerLike[],
        normalizer: (obj: tl.TypeInputPeer) => T | null): Promise<T[]>
    /**
     * Get multiple `InputPeer`s at once.
     *
     * If a peer was not found, `null` will be returned instead
     *
     * Uses async pool internally, with a concurrent limit of 8
     *
     * @param peerIds  Peer Ids
     */
    resolvePeerMany(
        peerIds: InputPeerLike[]): Promise<(tl.TypeInputPeer | null)[]>

    /**
     * Get the `InputPeer` of a known peer id.
     * Useful when an `InputPeer` is needed in Raw API.
     *
     * **Available**: ✅ both users and bots
     *
     * @param peerId  The peer identifier that you want to extract the `InputPeer` from.
     * @param [force=false]  Whether to force re-fetch the peer from the server
     */
    resolvePeer(
        peerId: InputPeerLike, force?: boolean): Promise<tl.TypeInputPeer>
    /**
     * Shorthand for `resolvePeer` that converts the input peer to `InputUser`.
     * **Available**: ✅ both users and bots
     *
     */
    resolveUser(
        peerId: InputPeerLike, force?: boolean): Promise<tl.TypeInputUser>
    /**
     * Shorthand for `resolvePeer` that converts the input peer to `InputChannel`.
     * **Available**: ✅ both users and bots
     *
     */
    resolveChannel(
        peerId: InputPeerLike, force?: boolean): Promise<tl.TypeInputChannel>

    /**
     * Get the `InputPeer` by user's phone number.
     * Useful when an `InputPeer` is needed in Raw API.
     *
     * **Available**: ✅ both users and bots
     *
     * @param phone  Phone number of the user
     * @param [force=false]  Whether to force re-fetch the peer from the server
     */
    resolvePhoneNumber(
        phone: string, force?: boolean): Promise<tl.TypeInputPeer>
    /**
     * Set an emoji status for the current user
     *
     * **Available**: ✅ both users and bots
     *
     * @deprecated – use {@link setEmojiStatus} with `self` instead
     */
    setMyEmojiStatus(
        emoji: tl.Long | null,
        params?: {
        /**
         * Date when the emoji status should expire (only if `emoji` is not `null`)
         */
            until?: number | Date
        }): Promise<void>
    /**
     * Set an emoji status for the given user/chat
     *
     * You can change emoji status of:
     *  - yourself (`self`)
     *  - supergroups or channels with enough boosts which you are an admin of
     *  - for bots – users who gave you the appropriate permissions
     */
    setEmojiStatus(
        params: {
        /** User or chat where the emoji status should be set */
            peerId: InputPeerLike
            /** Custom emoji ID or `null` to remove the emoji */
            emoji: tl.Long | null
            /** When true, `emoji` is the ID of the collectible emoji */
            isCollectible?: boolean
            /**
             * Date when the emoji status should expire (only if `emoji` is not `null`)
             */
            until?: number | Date
        }): Promise<void>
    /**
     * Changes the current default value of the Time-To-Live setting,
     * applied to all new chats.
     *
     * **Available**: 👤 users only
     *
     * @param period  New TTL period, in seconds (or 0 to disable)
     */
    setGlobalTtl(period: number): Promise<void>

    /**
     * Set or remove current user's birthday.
     * **Available**: 👤 users only
     *
     */
    setMyBirthday(
        birthday: {
        /** Birthday day */
            day: number
            /** Birthday month */
            month: number
            /** Birthday year (optional) */
            year?: number
        } | null): Promise<void>
    /**
     * Set a new profile photo or video for the current user.
     *
     * You can also pass a file ID or an InputPhoto to re-use existing photo.
     * **Available**: ✅ both users and bots
     *
     */
    setMyProfilePhoto(
        params: {
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
    setMyUsername(username: string | null): Promise<User>
    /**
     * Change user status to offline or online once,
     * which will expire after a while (currently ~5 minutes)
     *
     * For continuously sending online/offline status, use {@link setOnline}
     *
     * **Available**: 👤 users only
     *
     * @param online  Whether the user is currently online
     */
    sendOnline(online: boolean): Promise<void>
    /**
     * Change user status to online or offline
     *
     * Once called with `true`, mtcute will keep notifying the server
     * that the user is still online until a further call with `false` is made.
     *
     * **Available**: 👤 users only
     *
     * @param [online=true]
     */
    setOnline(online?: boolean): Promise<void>
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
    updateProfile(
        params: {
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

export type { TelegramClientOptions }

export * from './base.js'

export class TelegramClient implements ITelegramClient {
    _client: ITelegramClient
    constructor(opts: TelegramClientOptions) {
        ;(this as any).onRawUpdate = new Emitter()
        ;(this as any).onUpdate = new Emitter()
        ;(this as any).onNewMessage = new Emitter()
        ;(this as any).onEditMessage = new Emitter()
        ;(this as any).onMessageGroup = new Emitter()
        ;(this as any).onDeleteMessage = new Emitter()
        ;(this as any).onChatMemberUpdate = new Emitter()
        ;(this as any).onInlineQuery = new Emitter()
        ;(this as any).onChosenInlineResult = new Emitter()
        ;(this as any).onCallbackQuery = new Emitter()
        ;(this as any).onInlineCallbackQuery = new Emitter()
        ;(this as any).onBusinessCallbackQuery = new Emitter()
        ;(this as any).onPollUpdate = new Emitter()
        ;(this as any).onPollVote = new Emitter()
        ;(this as any).onUserStatusUpdate = new Emitter()
        ;(this as any).onUserTyping = new Emitter()
        ;(this as any).onHistoryRead = new Emitter()
        ;(this as any).onBotStopped = new Emitter()
        ;(this as any).onBotChatJoinRequest = new Emitter()
        ;(this as any).onChatJoinRequest = new Emitter()
        ;(this as any).onPreCheckoutQuery = new Emitter()
        ;(this as any).onStoryUpdate = new Emitter()
        ;(this as any).onDeleteStory = new Emitter()
        ;(this as any).onBotReactionUpdate = new Emitter()
        ;(this as any).onBotReactionCountUpdate = new Emitter()
        ;(this as any).onBusinessConnectionUpdate = new Emitter()
        ;(this as any).onNewBusinessMessage = new Emitter()
        ;(this as any).onEditBusinessMessage = new Emitter()
        ;(this as any).onBusinessMessageGroup = new Emitter()
        ;(this as any).onDeleteBusinessMessage = new Emitter()
        if ('client' in opts) {
            this._client = opts.client
        } else {
            if (!opts.storage || typeof opts.storage === 'string' || !opts.transport || !opts.crypto || !opts.platform) {
                throw new MtUnsupportedError(
                    'You need to explicitly provide storage, transport, crypto and platform for @mtcute/core',
                )
            }

            this._client = new BaseTelegramClient(opts as BaseTelegramClientOptions)
        }

        Object.defineProperty(this, 'log', { value: this._client.log })
        Object.defineProperty(this, 'storage', { value: this._client.storage })
        Object.defineProperty(this, 'timers', { value: this._client.timers })
        Object.defineProperty(this, 'stopSignal', { value: this._client.stopSignal })
        Object.defineProperty(this, 'appConfig', { value: this._client.appConfig })
        Object.defineProperty(this, 'onServerUpdate', { value: this._client.onServerUpdate })
        Object.defineProperty(this, 'onRawUpdate', { value: this._client.onRawUpdate })
        Object.defineProperty(this, 'onConnectionState', { value: this._client.onConnectionState })
        Object.defineProperty(this, 'onError', { value: this._client.onError })

        if (!opts.disableUpdates) {
            const skipConversationUpdates = opts.skipConversationUpdates ?? true
            const { messageGroupingInterval } = opts.updates ?? {}

            this._client.onRawUpdate.add(
                makeParsedUpdateHandler({
                    messageGroupingInterval,
                    onUpdate: (update) => {
                        if (Conversation.handleUpdate(this, update) && skipConversationUpdates) return

                        this.onUpdate.emit(update)
                        switch (update.name) {
                            case 'new_message':
                                this.onNewMessage.emit(update.data)
                                break
                            case 'edit_message':
                                this.onEditMessage.emit(update.data)
                                break
                            case 'message_group':
                                this.onMessageGroup.emit(update.data)
                                break
                            case 'delete_message':
                                this.onDeleteMessage.emit(update.data)
                                break
                            case 'chat_member':
                                this.onChatMemberUpdate.emit(update.data)
                                break
                            case 'inline_query':
                                this.onInlineQuery.emit(update.data)
                                break
                            case 'chosen_inline_result':
                                this.onChosenInlineResult.emit(update.data)
                                break
                            case 'callback_query':
                                this.onCallbackQuery.emit(update.data)
                                break
                            case 'inline_callback_query':
                                this.onInlineCallbackQuery.emit(update.data)
                                break
                            case 'business_callback_query':
                                this.onBusinessCallbackQuery.emit(update.data)
                                break
                            case 'poll':
                                this.onPollUpdate.emit(update.data)
                                break
                            case 'poll_vote':
                                this.onPollVote.emit(update.data)
                                break
                            case 'user_status':
                                this.onUserStatusUpdate.emit(update.data)
                                break
                            case 'user_typing':
                                this.onUserTyping.emit(update.data)
                                break
                            case 'history_read':
                                this.onHistoryRead.emit(update.data)
                                break
                            case 'bot_stopped':
                                this.onBotStopped.emit(update.data)
                                break
                            case 'bot_chat_join_request':
                                this.onBotChatJoinRequest.emit(update.data)
                                break
                            case 'chat_join_request':
                                this.onChatJoinRequest.emit(update.data)
                                break
                            case 'pre_checkout_query':
                                this.onPreCheckoutQuery.emit(update.data)
                                break
                            case 'story':
                                this.onStoryUpdate.emit(update.data)
                                break
                            case 'delete_story':
                                this.onDeleteStory.emit(update.data)
                                break
                            case 'bot_reaction':
                                this.onBotReactionUpdate.emit(update.data)
                                break
                            case 'bot_reaction_count':
                                this.onBotReactionCountUpdate.emit(update.data)
                                break
                            case 'business_connection':
                                this.onBusinessConnectionUpdate.emit(update.data)
                                break
                            case 'new_business_message':
                                this.onNewBusinessMessage.emit(update.data)
                                break
                            case 'edit_business_message':
                                this.onEditBusinessMessage.emit(update.data)
                                break
                            case 'business_message_group':
                                this.onBusinessMessageGroup.emit(update.data)
                                break
                            case 'delete_business_message':
                                this.onDeleteBusinessMessage.emit(update.data)
                                break
                        }
                    },
                }),
            )
        }
    }

    withParams(params: RpcCallOptions): this {
        return withParams(this, params)
    }
}
TelegramClient.prototype.checkPassword = function (...args) {
    return checkPassword(this._client, ...args)
}
TelegramClient.prototype.getPasswordHint = function (...args) {
    return getPasswordHint(this._client, ...args)
}
TelegramClient.prototype.logOut = function (...args) {
    return logOut(this._client, ...args)
}
TelegramClient.prototype.recoverPassword = function (...args) {
    return recoverPassword(this._client, ...args)
}
TelegramClient.prototype.resendCode = function (...args) {
    return resendCode(this._client, ...args)
}
TelegramClient.prototype.run = function (...args) {
    return run(this._client, ...args)
}
TelegramClient.prototype.sendCode = function (...args) {
    return sendCode(this._client, ...args)
}
TelegramClient.prototype.sendRecoveryCode = function (...args) {
    return sendRecoveryCode(this._client, ...args)
}
TelegramClient.prototype.signInBot = function (...args) {
    return signInBot(this._client, ...args)
}
TelegramClient.prototype.signInQr = function (...args) {
    return signInQr(this._client, ...args)
}
TelegramClient.prototype.signIn = function (...args) {
    return signIn(this._client, ...args)
}
TelegramClient.prototype.startTest = function (...args) {
    return startTest(this._client, ...args)
}
TelegramClient.prototype.start = function (...args) {
    return start(this._client, ...args)
}
TelegramClient.prototype.isSelfPeer = function (...args) {
    return isSelfPeer(this._client, ...args)
}
TelegramClient.prototype.answerCallbackQuery = function (...args) {
    return answerCallbackQuery(this._client, ...args)
}
TelegramClient.prototype.answerInlineQuery = function (...args) {
    return answerInlineQuery(this._client, ...args)
}
TelegramClient.prototype.answerPreCheckoutQuery = function (...args) {
    return answerPreCheckoutQuery(this._client, ...args)
}
TelegramClient.prototype.deleteMyCommands = function (...args) {
    return deleteMyCommands(this._client, ...args)
}
TelegramClient.prototype.getBotInfo = function (...args) {
    return getBotInfo(this._client, ...args)
}
TelegramClient.prototype.getBotMenuButton = function (...args) {
    return getBotMenuButton(this._client, ...args)
}
TelegramClient.prototype.getCallbackAnswer = function (...args) {
    return getCallbackAnswer(this._client, ...args)
}
TelegramClient.prototype.getGameHighScores = function (...args) {
    return getGameHighScores(this._client, ...args)
}
TelegramClient.prototype.getInlineGameHighScores = function (...args) {
    return getInlineGameHighScores(this._client, ...args)
}
TelegramClient.prototype.getMyCommands = function (...args) {
    return getMyCommands(this._client, ...args)
}
TelegramClient.prototype.openWebview = function (...args) {
    return openWebview(this._client, ...args)
}
TelegramClient.prototype.closeWebview = function (...args) {
    return closeWebview(this._client, ...args)
}
TelegramClient.prototype.prepareInlineMessage = function (...args) {
    return prepareInlineMessage(this._client, ...args)
}
TelegramClient.prototype.setBotInfo = function (...args) {
    return setBotInfo(this._client, ...args)
}
TelegramClient.prototype.setBotMenuButton = function (...args) {
    return setBotMenuButton(this._client, ...args)
}
TelegramClient.prototype.setGameScore = function (...args) {
    return setGameScore(this._client, ...args)
}
TelegramClient.prototype.setInlineGameScore = function (...args) {
    return setInlineGameScore(this._client, ...args)
}
TelegramClient.prototype.setMyCommands = function (...args) {
    return setMyCommands(this._client, ...args)
}
TelegramClient.prototype.setMyDefaultRights = function (...args) {
    return setMyDefaultRights(this._client, ...args)
}
TelegramClient.prototype.toggleEmojiStatusPermission = function (...args) {
    return toggleEmojiStatusPermission(this._client, ...args)
}
TelegramClient.prototype.addChatMembers = function (...args) {
    return addChatMembers(this._client, ...args)
}
TelegramClient.prototype.archiveChats = function (...args) {
    return archiveChats(this._client, ...args)
}
TelegramClient.prototype.banChatMember = function (...args) {
    return banChatMember(this._client, ...args)
}
TelegramClient.prototype.createChannel = function (...args) {
    return createChannel(this._client, ...args)
}
TelegramClient.prototype.createGroup = function (...args) {
    return createGroup(this._client, ...args)
}
TelegramClient.prototype.createSupergroup = function (...args) {
    return createSupergroup(this._client, ...args)
}
TelegramClient.prototype.deleteChannel = function (...args) {
    return deleteChannel(this._client, ...args)
}
TelegramClient.prototype.deleteSupergroup = function (...args) {
    return deleteChannel(this._client, ...args)
}
TelegramClient.prototype.deleteChatPhoto = function (...args) {
    return deleteChatPhoto(this._client, ...args)
}
TelegramClient.prototype.deleteGroup = function (...args) {
    return deleteGroup(this._client, ...args)
}
TelegramClient.prototype.deleteHistory = function (...args) {
    return deleteHistory(this._client, ...args)
}
TelegramClient.prototype.deleteUserHistory = function (...args) {
    return deleteUserHistory(this._client, ...args)
}
TelegramClient.prototype.editAdminRights = function (...args) {
    return editAdminRights(this._client, ...args)
}
TelegramClient.prototype.getChatEventLog = function (...args) {
    return getChatEventLog(this._client, ...args)
}
TelegramClient.prototype.getChatMember = function (...args) {
    return getChatMember(this._client, ...args)
}
TelegramClient.prototype.getChatMembers = function (...args) {
    return getChatMembers(this._client, ...args)
}
TelegramClient.prototype.getChatPreview = function (...args) {
    return getChatPreview(this._client, ...args)
}
TelegramClient.prototype.getChat = function (...args) {
    return getChat(this._client, ...args)
}
TelegramClient.prototype.getFullChat = function (...args) {
    return getFullChat(this._client, ...args)
}
TelegramClient.prototype.getFullUser = function (...args) {
    return getFullUser(this._client, ...args)
}
TelegramClient.prototype.getMessageAuthor = function (...args) {
    return getMessageAuthor(this._client, ...args)
}
TelegramClient.prototype.getNearbyChats = function (...args) {
    return getNearbyChats(this._client, ...args)
}
TelegramClient.prototype.getPeer = function (...args) {
    return getPeer(this._client, ...args)
}
TelegramClient.prototype.getSimilarChannels = function (...args) {
    return getSimilarChannels(this._client, ...args)
}
TelegramClient.prototype.getUser = function (...args) {
    return getUser(this._client, ...args)
}
TelegramClient.prototype.iterChatEventLog = function (...args) {
    return iterChatEventLog(this._client, ...args)
}
TelegramClient.prototype.iterChatMembers = function (...args) {
    return iterChatMembers(this._client, ...args)
}
TelegramClient.prototype.joinChat = function (...args) {
    return joinChat(this._client, ...args)
}
TelegramClient.prototype.kickChatMember = function (...args) {
    return kickChatMember(this._client, ...args)
}
TelegramClient.prototype.leaveChat = function (...args) {
    return leaveChat(this._client, ...args)
}
TelegramClient.prototype.markChatUnread = function (...args) {
    return markChatUnread(this._client, ...args)
}
TelegramClient.prototype.openChat = function (...args) {
    return openChat(this._client, ...args)
}
TelegramClient.prototype.closeChat = function (...args) {
    return closeChat(this._client, ...args)
}
TelegramClient.prototype.reorderUsernames = function (...args) {
    return reorderUsernames(this._client, ...args)
}
TelegramClient.prototype.restrictChatMember = function (...args) {
    return restrictChatMember(this._client, ...args)
}
TelegramClient.prototype.saveDraft = function (...args) {
    return saveDraft(this._client, ...args)
}
TelegramClient.prototype.setChatColor = function (...args) {
    return setChatColor(this._client, ...args)
}
TelegramClient.prototype.setChatDefaultPermissions = function (...args) {
    return setChatDefaultPermissions(this._client, ...args)
}
TelegramClient.prototype.setChatDescription = function (...args) {
    return setChatDescription(this._client, ...args)
}
TelegramClient.prototype.setChatPhoto = function (...args) {
    return setChatPhoto(this._client, ...args)
}
TelegramClient.prototype.setChatTitle = function (...args) {
    return setChatTitle(this._client, ...args)
}
TelegramClient.prototype.setChatTtl = function (...args) {
    return setChatTtl(this._client, ...args)
}
TelegramClient.prototype.setChatUsername = function (...args) {
    return setChatUsername(this._client, ...args)
}
TelegramClient.prototype.setSlowMode = function (...args) {
    return setSlowMode(this._client, ...args)
}
TelegramClient.prototype.toggleContentProtection = function (...args) {
    return toggleContentProtection(this._client, ...args)
}
TelegramClient.prototype.toggleFragmentUsername = function (...args) {
    return toggleFragmentUsername(this._client, ...args)
}
TelegramClient.prototype.toggleJoinRequests = function (...args) {
    return toggleJoinRequests(this._client, ...args)
}
TelegramClient.prototype.toggleJoinToSend = function (...args) {
    return toggleJoinToSend(this._client, ...args)
}
TelegramClient.prototype.unarchiveChats = function (...args) {
    return unarchiveChats(this._client, ...args)
}
TelegramClient.prototype.unbanChatMember = function (...args) {
    return unbanChatMember(this._client, ...args)
}
TelegramClient.prototype.unrestrictChatMember = function (...args) {
    return unbanChatMember(this._client, ...args)
}
TelegramClient.prototype.addContact = function (...args) {
    return addContact(this._client, ...args)
}
TelegramClient.prototype.deleteContacts = function (...args) {
    return deleteContacts(this._client, ...args)
}
TelegramClient.prototype.getContacts = function (...args) {
    return getContacts(this._client, ...args)
}
TelegramClient.prototype.importContacts = function (...args) {
    return importContacts(this._client, ...args)
}
TelegramClient.prototype.createFolder = function (...args) {
    return createFolder(this._client, ...args)
}
TelegramClient.prototype.deleteFolder = function (...args) {
    return deleteFolder(this._client, ...args)
}
TelegramClient.prototype.editFolder = function (...args) {
    return editFolder(this._client, ...args)
}
TelegramClient.prototype.findDialogs = function (...args) {
    return findDialogs(this._client, ...args)
}
TelegramClient.prototype.findFolder = function (...args) {
    return findFolder(this._client, ...args)
}
TelegramClient.prototype.getChatlistPreview = function (...args) {
    return getChatlistPreview(this._client, ...args)
}
TelegramClient.prototype.getFolders = function (...args) {
    return getFolders(this._client, ...args)
}
TelegramClient.prototype.getPeerDialogs = function (...args) {
    return getPeerDialogs(this._client, ...args)
}
TelegramClient.prototype.iterDialogs = function (...args) {
    return iterDialogs(this._client, ...args)
}
TelegramClient.prototype.joinChatlist = function (...args) {
    return joinChatlist(this._client, ...args)
}
TelegramClient.prototype.setFoldersOrder = function (...args) {
    return setFoldersOrder(this._client, ...args)
}
TelegramClient.prototype.downloadAsBuffer = function (...args) {
    return downloadAsBuffer(this._client, ...args)
}
TelegramClient.prototype.downloadAsIterable = function (...args) {
    return downloadAsIterable(this._client, ...args)
}
TelegramClient.prototype.downloadAsStream = function (...args) {
    return downloadAsStream(this._client, ...args)
}
TelegramClient.prototype._normalizeInputFile = function (...args) {
    return _normalizeInputFile(this._client, ...args)
}
TelegramClient.prototype._normalizeInputMedia = function (...args) {
    return _normalizeInputMedia(this._client, ...args)
}
TelegramClient.prototype.uploadFile = function (...args) {
    return uploadFile(this._client, ...args)
}
TelegramClient.prototype.uploadMedia = function (...args) {
    return uploadMedia(this._client, ...args)
}
TelegramClient.prototype.createForumTopic = function (...args) {
    return createForumTopic(this._client, ...args)
}
TelegramClient.prototype.deleteForumTopicHistory = function (...args) {
    return deleteForumTopicHistory(this._client, ...args)
}
TelegramClient.prototype.editForumTopic = function (...args) {
    return editForumTopic(this._client, ...args)
}
TelegramClient.prototype.getForumTopicsById = function (...args) {
    return getForumTopicsById(this._client, ...args)
}
TelegramClient.prototype.getForumTopics = function (...args) {
    return getForumTopics(this._client, ...args)
}
TelegramClient.prototype.iterForumTopics = function (...args) {
    return iterForumTopics(this._client, ...args)
}
TelegramClient.prototype.reorderPinnedForumTopics = function (...args) {
    return reorderPinnedForumTopics(this._client, ...args)
}
TelegramClient.prototype.toggleForumTopicClosed = function (...args) {
    return toggleForumTopicClosed(this._client, ...args)
}
TelegramClient.prototype.toggleForumTopicPinned = function (...args) {
    return toggleForumTopicPinned(this._client, ...args)
}
TelegramClient.prototype.toggleForum = function (...args) {
    return toggleForum(this._client, ...args)
}
TelegramClient.prototype.updateForumSettings = function (...args) {
    return updateForumSettings(this._client, ...args)
}
TelegramClient.prototype.toggleGeneralTopicHidden = function (...args) {
    return toggleGeneralTopicHidden(this._client, ...args)
}
TelegramClient.prototype.createInviteLink = function (...args) {
    return createInviteLink(this._client, ...args)
}
TelegramClient.prototype.editInviteLink = function (...args) {
    return editInviteLink(this._client, ...args)
}
TelegramClient.prototype.exportInviteLink = function (...args) {
    return exportInviteLink(this._client, ...args)
}
TelegramClient.prototype.getInviteLinkMembers = function (...args) {
    return getInviteLinkMembers(this._client, ...args)
}
TelegramClient.prototype.getInviteLink = function (...args) {
    return getInviteLink(this._client, ...args)
}
TelegramClient.prototype.getInviteLinks = function (...args) {
    return getInviteLinks(this._client, ...args)
}
TelegramClient.prototype.getPrimaryInviteLink = function (...args) {
    return getPrimaryInviteLink(this._client, ...args)
}
TelegramClient.prototype.hideAllJoinRequests = function (...args) {
    return hideAllJoinRequests(this._client, ...args)
}
TelegramClient.prototype.hideJoinRequest = function (...args) {
    return hideJoinRequest(this._client, ...args)
}
TelegramClient.prototype.iterInviteLinkMembers = function (...args) {
    return iterInviteLinkMembers(this._client, ...args)
}
TelegramClient.prototype.iterInviteLinks = function (...args) {
    return iterInviteLinks(this._client, ...args)
}
TelegramClient.prototype.revokeInviteLink = function (...args) {
    return revokeInviteLink(this._client, ...args)
}
TelegramClient.prototype.appendTodoList = function (...args) {
    return appendTodoList(this._client, ...args)
}
TelegramClient.prototype.closePoll = function (...args) {
    return closePoll(this._client, ...args)
}
TelegramClient.prototype.deleteMessagesById = function (...args) {
    return deleteMessagesById(this._client, ...args)
}
TelegramClient.prototype.deleteMessages = function (...args) {
    return deleteMessages(this._client, ...args)
}
TelegramClient.prototype.deleteScheduledMessages = function (...args) {
    return deleteScheduledMessages(this._client, ...args)
}
TelegramClient.prototype.editInlineMessage = function (...args) {
    return editInlineMessage(this._client, ...args)
}
TelegramClient.prototype.editMessage = function (...args) {
    return editMessage(this._client, ...args)
}
TelegramClient.prototype.forwardMessagesById = function (...args) {
    return forwardMessagesById(this._client, ...args)
}
TelegramClient.prototype.forwardMessages = function (...args) {
    return forwardMessages(this._client, ...args)
}
TelegramClient.prototype.getAllScheduledMessages = function (...args) {
    return getAllScheduledMessages(this._client, ...args)
}
TelegramClient.prototype.getAvailableMessageEffects = function (...args) {
    return getAvailableMessageEffects(this._client, ...args)
}
TelegramClient.prototype.getCallbackQueryMessage = function (...args) {
    return getCallbackQueryMessage(this._client, ...args)
}
TelegramClient.prototype.getDiscussionMessage = function (...args) {
    return getDiscussionMessage(this._client, ...args)
}
TelegramClient.prototype.getFactCheck = function (...args) {
    return getFactCheck(this._client, ...args)
}
TelegramClient.prototype.getHistory = function (...args) {
    return getHistory(this._client, ...args)
}
TelegramClient.prototype.getMessageByLink = function (...args) {
    return getMessageByLink(this._client, ...args)
}
TelegramClient.prototype.getMessageGroup = function (...args) {
    return getMessageGroup(this._client, ...args)
}
TelegramClient.prototype.getMessageReactionsById = function (...args) {
    return getMessageReactionsById(this._client, ...args)
}
TelegramClient.prototype.getMessageReactions = function (...args) {
    return getMessageReactions(this._client, ...args)
}
TelegramClient.prototype.getMessagesUnsafe = function (...args) {
    return getMessagesUnsafe(this._client, ...args)
}
TelegramClient.prototype.getMessages = function (...args) {
    return getMessages(this._client, ...args)
}
TelegramClient.prototype.getReactionUsers = function (...args) {
    return getReactionUsers(this._client, ...args)
}
TelegramClient.prototype.getReplyTo = function (...args) {
    return getReplyTo(this._client, ...args)
}
TelegramClient.prototype.getScheduledMessages = function (...args) {
    return getScheduledMessages(this._client, ...args)
}
TelegramClient.prototype.getWebPagePreview = function (...args) {
    return getWebPagePreview(this._client, ...args)
}
TelegramClient.prototype.iterHistory = function (...args) {
    return iterHistory(this._client, ...args)
}
TelegramClient.prototype.iterReactionUsers = function (...args) {
    return iterReactionUsers(this._client, ...args)
}
TelegramClient.prototype.iterSearchGlobal = function (...args) {
    return iterSearchGlobal(this._client, ...args)
}
TelegramClient.prototype.iterSearchMessages = function (...args) {
    return iterSearchMessages(this._client, ...args)
}
TelegramClient.prototype.pinMessage = function (...args) {
    return pinMessage(this._client, ...args)
}
TelegramClient.prototype.readHistory = function (...args) {
    return readHistory(this._client, ...args)
}
TelegramClient.prototype.readReactions = function (...args) {
    return readReactions(this._client, ...args)
}
TelegramClient.prototype.searchGlobal = function (...args) {
    return searchGlobal(this._client, ...args)
}
TelegramClient.prototype.searchHashtag = function (...args) {
    return searchHashtag(this._client, ...args)
}
TelegramClient.prototype.iterSearchHashtag = function (...args) {
    return iterSearchHashtag(this._client, ...args)
}
TelegramClient.prototype.searchMessages = function (...args) {
    return searchMessages(this._client, ...args)
}
TelegramClient.prototype.answerText = function (...args) {
    return answerText(this._client, ...args)
}
TelegramClient.prototype.answerMedia = function (...args) {
    return answerMedia(this._client, ...args)
}
TelegramClient.prototype.answerMediaGroup = function (...args) {
    return answerMediaGroup(this._client, ...args)
}
TelegramClient.prototype.commentText = function (...args) {
    return commentText(this._client, ...args)
}
TelegramClient.prototype.commentMedia = function (...args) {
    return commentMedia(this._client, ...args)
}
TelegramClient.prototype.commentMediaGroup = function (...args) {
    return commentMediaGroup(this._client, ...args)
}
TelegramClient.prototype.sendCopyGroup = function (...args) {
    return sendCopyGroup(this._client, ...args)
}
TelegramClient.prototype.sendCopy = function (...args) {
    return sendCopy(this._client, ...args)
}
TelegramClient.prototype.sendMediaGroup = function (...args) {
    return sendMediaGroup(this._client, ...args)
}
TelegramClient.prototype.sendMedia = function (...args) {
    return sendMedia(this._client, ...args)
}
TelegramClient.prototype.sendPaidReaction = function (...args) {
    return sendPaidReaction(this._client, ...args)
}
TelegramClient.prototype.quoteWithText = function (...args) {
    return quoteWithText(this._client, ...args)
}
TelegramClient.prototype.quoteWithMedia = function (...args) {
    return quoteWithMedia(this._client, ...args)
}
TelegramClient.prototype.quoteWithMediaGroup = function (...args) {
    return quoteWithMediaGroup(this._client, ...args)
}
TelegramClient.prototype.sendReaction = function (...args) {
    return sendReaction(this._client, ...args)
}
TelegramClient.prototype.replyText = function (...args) {
    return replyText(this._client, ...args)
}
TelegramClient.prototype.replyMedia = function (...args) {
    return replyMedia(this._client, ...args)
}
TelegramClient.prototype.replyMediaGroup = function (...args) {
    return replyMediaGroup(this._client, ...args)
}
TelegramClient.prototype.sendScheduled = function (...args) {
    return sendScheduled(this._client, ...args)
}
TelegramClient.prototype.sendText = function (...args) {
    return sendText(this._client, ...args)
}
TelegramClient.prototype.sendTyping = function (...args) {
    return sendTyping(this._client, ...args)
}
TelegramClient.prototype.sendVote = function (...args) {
    return sendVote(this._client, ...args)
}
TelegramClient.prototype.setTyping = function (...args) {
    return setTyping(this._client, ...args)
}
TelegramClient.prototype.toggleTodoCompleted = function (...args) {
    return toggleTodoCompleted(this._client, ...args)
}
TelegramClient.prototype.translateMessage = function (...args) {
    return translateMessage(this._client, ...args)
}
TelegramClient.prototype.translateText = function (...args) {
    return translateText(this._client, ...args)
}
TelegramClient.prototype.unpinAllMessages = function (...args) {
    return unpinAllMessages(this._client, ...args)
}
TelegramClient.prototype.unpinMessage = function (...args) {
    return unpinMessage(this._client, ...args)
}
TelegramClient.prototype.getCollectibleInfo = function (...args) {
    return getCollectibleInfo(this._client, ...args)
}
TelegramClient.prototype.initTakeoutSession = function (...args) {
    return initTakeoutSession(this._client, ...args)
}
TelegramClient.prototype._normalizePrivacyRules = function (...args) {
    return _normalizePrivacyRules(this._client, ...args)
}
TelegramClient.prototype.changeCloudPassword = function (...args) {
    return changeCloudPassword(this._client, ...args)
}
TelegramClient.prototype.enableCloudPassword = function (...args) {
    return enableCloudPassword(this._client, ...args)
}
TelegramClient.prototype.verifyPasswordEmail = function (...args) {
    return verifyPasswordEmail(this._client, ...args)
}
TelegramClient.prototype.resendPasswordEmail = function (...args) {
    return resendPasswordEmail(this._client, ...args)
}
TelegramClient.prototype.cancelPasswordEmail = function (...args) {
    return cancelPasswordEmail(this._client, ...args)
}
TelegramClient.prototype.removeCloudPassword = function (...args) {
    return removeCloudPassword(this._client, ...args)
}
TelegramClient.prototype._normalizeInputStarGift = function (...args) {
    return _normalizeInputStarGift(this._client, ...args)
}
TelegramClient.prototype.acceptStarGift = function (...args) {
    return acceptStarGift(this._client, ...args)
}
TelegramClient.prototype.applyBoost = function (...args) {
    return applyBoost(this._client, ...args)
}
TelegramClient.prototype.buyResaleGift = function (...args) {
    return buyResaleGift(this._client, ...args)
}
TelegramClient.prototype.canApplyBoost = function (...args) {
    return canApplyBoost(this._client, ...args)
}
TelegramClient.prototype.createBusinessChatLink = function (...args) {
    return createBusinessChatLink(this._client, ...args)
}
TelegramClient.prototype.editBusinessChatLink = function (...args) {
    return editBusinessChatLink(this._client, ...args)
}
TelegramClient.prototype.deleteBusinessChatLink = function (...args) {
    return deleteBusinessChatLink(this._client, ...args)
}
TelegramClient.prototype.getBoostStats = function (...args) {
    return getBoostStats(this._client, ...args)
}
TelegramClient.prototype.getBoosts = function (...args) {
    return getBoosts(this._client, ...args)
}
TelegramClient.prototype.getBusinessChatLinks = function (...args) {
    return getBusinessChatLinks(this._client, ...args)
}
TelegramClient.prototype.getBusinessConnection = function (...args) {
    return getBusinessConnection(this._client, ...args)
}
TelegramClient.prototype.getMyBoostSlots = function (...args) {
    return getMyBoostSlots(this._client, ...args)
}
TelegramClient.prototype.getResaleOptions = function (...args) {
    return getResaleOptions(this._client, ...args)
}
TelegramClient.prototype.getSavedStarGiftsById = function (...args) {
    return getSavedStarGiftsById(this._client, ...args)
}
TelegramClient.prototype.getSavedStarGifts = function (...args) {
    return getSavedStarGifts(this._client, ...args)
}
TelegramClient.prototype.getStarGiftOptions = function (...args) {
    return getStarGiftOptions(this._client, ...args)
}
TelegramClient.prototype.getStarGiftWithdrawalUrl = function (...args) {
    return getStarGiftWithdrawalUrl(this._client, ...args)
}
TelegramClient.prototype.getStarsTransactions = function (...args) {
    return getStarsTransactions(this._client, ...args)
}
TelegramClient.prototype.getUniqueStarGift = function (...args) {
    return getUniqueStarGift(this._client, ...args)
}
TelegramClient.prototype.iterBoosters = function (...args) {
    return iterBoosters(this._client, ...args)
}
TelegramClient.prototype.iterSavedStarGifts = function (...args) {
    return iterSavedStarGifts(this._client, ...args)
}
TelegramClient.prototype.iterStarsTransactions = function (...args) {
    return iterStarsTransactions(this._client, ...args)
}
TelegramClient.prototype.togglePinnedStarGifts = function (...args) {
    return togglePinnedStarGifts(this._client, ...args)
}
TelegramClient.prototype.sendStarGift = function (...args) {
    return sendStarGift(this._client, ...args)
}
TelegramClient.prototype.setBusinessIntro = function (...args) {
    return setBusinessIntro(this._client, ...args)
}
TelegramClient.prototype.setBusinessWorkHours = function (...args) {
    return setBusinessWorkHours(this._client, ...args)
}
TelegramClient.prototype.setResaleStarGiftPrice = function (...args) {
    return setResaleStarGiftPrice(this._client, ...args)
}
TelegramClient.prototype.transferStarGift = function (...args) {
    return transferStarGift(this._client, ...args)
}
TelegramClient.prototype.upgradeStarGift = function (...args) {
    return upgradeStarGift(this._client, ...args)
}
TelegramClient.prototype.addStickerToSet = function (...args) {
    return addStickerToSet(this._client, ...args)
}
TelegramClient.prototype.createStickerSet = function (...args) {
    return createStickerSet(this._client, ...args)
}
TelegramClient.prototype.deleteStickerFromSet = function (...args) {
    return deleteStickerFromSet(this._client, ...args)
}
TelegramClient.prototype.getCustomEmojis = function (...args) {
    return getCustomEmojis(this._client, ...args)
}
TelegramClient.prototype.getCustomEmojisFromMessages = function (...args) {
    return getCustomEmojisFromMessages(this._client, ...args)
}
TelegramClient.prototype.getInstalledStickers = function (...args) {
    return getInstalledStickers(this._client, ...args)
}
TelegramClient.prototype.getMyStickerSets = function (...args) {
    return getMyStickerSets(this._client, ...args)
}
TelegramClient.prototype.getStickerSet = function (...args) {
    return getStickerSet(this._client, ...args)
}
TelegramClient.prototype.moveStickerInSet = function (...args) {
    return moveStickerInSet(this._client, ...args)
}
TelegramClient.prototype.replaceStickerInSet = function (...args) {
    return replaceStickerInSet(this._client, ...args)
}
TelegramClient.prototype.setChatStickerSet = function (...args) {
    return setChatStickerSet(this._client, ...args)
}
TelegramClient.prototype.setStickerSetThumb = function (...args) {
    return setStickerSetThumb(this._client, ...args)
}
TelegramClient.prototype.canSendStory = function (...args) {
    return canSendStory(this._client, ...args)
}
TelegramClient.prototype.deleteStories = function (...args) {
    return deleteStories(this._client, ...args)
}
TelegramClient.prototype.editStory = function (...args) {
    return editStory(this._client, ...args)
}
TelegramClient.prototype.getAllStories = function (...args) {
    return getAllStories(this._client, ...args)
}
TelegramClient.prototype.getPeerStories = function (...args) {
    return getPeerStories(this._client, ...args)
}
TelegramClient.prototype.getProfileStories = function (...args) {
    return getProfileStories(this._client, ...args)
}
TelegramClient.prototype.getStoriesById = function (...args) {
    return getStoriesById(this._client, ...args)
}
TelegramClient.prototype.getStoriesInteractions = function (...args) {
    return getStoriesInteractions(this._client, ...args)
}
TelegramClient.prototype.getStoryLink = function (...args) {
    return getStoryLink(this._client, ...args)
}
TelegramClient.prototype.getStoryViewers = function (...args) {
    return getStoryViewers(this._client, ...args)
}
TelegramClient.prototype.hideMyStoriesViews = function (...args) {
    return hideMyStoriesViews(this._client, ...args)
}
TelegramClient.prototype.incrementStoriesViews = function (...args) {
    return incrementStoriesViews(this._client, ...args)
}
TelegramClient.prototype.iterAllStories = function (...args) {
    return iterAllStories(this._client, ...args)
}
TelegramClient.prototype.iterProfileStories = function (...args) {
    return iterProfileStories(this._client, ...args)
}
TelegramClient.prototype.iterStoryViewers = function (...args) {
    return iterStoryViewers(this._client, ...args)
}
TelegramClient.prototype.readStories = function (...args) {
    return readStories(this._client, ...args)
}
TelegramClient.prototype.sendStoryReaction = function (...args) {
    return sendStoryReaction(this._client, ...args)
}
TelegramClient.prototype.sendStory = function (...args) {
    return sendStory(this._client, ...args)
}
TelegramClient.prototype.togglePeerStoriesArchived = function (...args) {
    return togglePeerStoriesArchived(this._client, ...args)
}
TelegramClient.prototype.toggleStoriesPinned = function (...args) {
    return toggleStoriesPinned(this._client, ...args)
}
TelegramClient.prototype.blockUser = function (...args) {
    return blockUser(this._client, ...args)
}
TelegramClient.prototype.deleteProfilePhotos = function (...args) {
    return deleteProfilePhotos(this._client, ...args)
}
TelegramClient.prototype.editCloseFriendsRaw = function (...args) {
    return editCloseFriendsRaw(this._client, ...args)
}
TelegramClient.prototype.editCloseFriends = function (...args) {
    return editCloseFriends(this._client, ...args)
}
TelegramClient.prototype.getCommonChats = function (...args) {
    return getCommonChats(this._client, ...args)
}
TelegramClient.prototype.getGlobalTtl = function (...args) {
    return getGlobalTtl(this._client, ...args)
}
TelegramClient.prototype.getMe = function (...args) {
    return getMe(this._client, ...args)
}
TelegramClient.prototype.getMyUsername = function (...args) {
    return getMyUsername(this._client, ...args)
}
TelegramClient.prototype.getPeerSettings = function (...args) {
    return getPeerSettings(this._client, ...args)
}
TelegramClient.prototype.getProfilePhoto = function (...args) {
    return getProfilePhoto(this._client, ...args)
}
TelegramClient.prototype.getProfilePhotos = function (...args) {
    return getProfilePhotos(this._client, ...args)
}
TelegramClient.prototype.getUsers = function (...args) {
    return getUsers(this._client, ...args)
}
TelegramClient.prototype.isPeerAvailable = function (...args) {
    return isPeerAvailable(this._client, ...args)
}
TelegramClient.prototype.iterProfilePhotos = function (...args) {
    return iterProfilePhotos(this._client, ...args)
}
// @ts-expect-error this kinda breaks typings for overloads, idc
TelegramClient.prototype.resolvePeerMany = function (...args) {
// @ts-expect-error this kinda breaks typings for overloads, idc
    return resolvePeerMany(this._client, ...args)
}
TelegramClient.prototype.resolvePeer = function (...args) {
    return resolvePeer(this._client, ...args)
}
TelegramClient.prototype.resolveUser = function (...args) {
    return resolveUser(this._client, ...args)
}
TelegramClient.prototype.resolveChannel = function (...args) {
    return resolveChannel(this._client, ...args)
}
TelegramClient.prototype.resolvePhoneNumber = function (...args) {
    return resolvePhoneNumber(this._client, ...args)
}
TelegramClient.prototype.setMyEmojiStatus = function (...args) {
    return setMyEmojiStatus(this._client, ...args)
}
TelegramClient.prototype.setEmojiStatus = function (...args) {
    return setEmojiStatus(this._client, ...args)
}
TelegramClient.prototype.setGlobalTtl = function (...args) {
    return setGlobalTtl(this._client, ...args)
}
TelegramClient.prototype.setMyBirthday = function (...args) {
    return setMyBirthday(this._client, ...args)
}
TelegramClient.prototype.setMyProfilePhoto = function (...args) {
    return setMyProfilePhoto(this._client, ...args)
}
TelegramClient.prototype.setMyUsername = function (...args) {
    return setMyUsername(this._client, ...args)
}
TelegramClient.prototype.sendOnline = function (...args) {
    return sendOnline(this._client, ...args)
}
TelegramClient.prototype.setOnline = function (...args) {
    return setOnline(this._client, ...args)
}
TelegramClient.prototype.unblockUser = function (...args) {
    return unblockUser(this._client, ...args)
}
TelegramClient.prototype.updateProfile = function (...args) {
    return updateProfile(this._client, ...args)
}
TelegramClient.prototype.prepare = function (...args) {
    return this._client.prepare(...args)
}
TelegramClient.prototype.connect = function (...args) {
    return this._client.connect(...args)
}
TelegramClient.prototype.disconnect = function (...args) {
    return this._client.disconnect(...args)
}
TelegramClient.prototype.destroy = function (...args) {
    return this._client.destroy(...args)
}
TelegramClient.prototype.notifyLoggedIn = function (...args) {
    return this._client.notifyLoggedIn(...args)
}
TelegramClient.prototype.notifyLoggedOut = function (...args) {
    return this._client.notifyLoggedOut(...args)
}
TelegramClient.prototype.notifyChannelOpened = function (...args) {
    return this._client.notifyChannelOpened(...args)
}
TelegramClient.prototype.notifyChannelClosed = function (...args) {
    return this._client.notifyChannelClosed(...args)
}
TelegramClient.prototype.startUpdatesLoop = function (...args) {
    return this._client.startUpdatesLoop(...args)
}
TelegramClient.prototype.stopUpdatesLoop = function (...args) {
    return this._client.stopUpdatesLoop(...args)
}
TelegramClient.prototype.call = function (...args) {
    return this._client.call(...args)
}
TelegramClient.prototype.importSession = function (...args) {
    return this._client.importSession(...args)
}
TelegramClient.prototype.exportSession = function (...args) {
    return this._client.exportSession(...args)
}
TelegramClient.prototype.handleClientUpdate = function (...args) {
    return this._client.handleClientUpdate(...args)
}
TelegramClient.prototype.getApiCredentials = function (...args) {
    return this._client.getApiCredentials(...args)
}
TelegramClient.prototype.getPoolSize = function (...args) {
    return this._client.getPoolSize(...args)
}
TelegramClient.prototype.getPrimaryDcId = function (...args) {
    return this._client.getPrimaryDcId(...args)
}
TelegramClient.prototype.computeSrpParams = function (...args) {
    return this._client.computeSrpParams(...args)
}
TelegramClient.prototype.computeNewPasswordHash = function (...args) {
    return this._client.computeNewPasswordHash(...args)
}
TelegramClient.prototype.changePrimaryDc = function (...args) {
    return this._client.changePrimaryDc(...args)
}
TelegramClient.prototype.getMtprotoMessageId = function (...args) {
    return this._client.getMtprotoMessageId(...args)
}
TelegramClient.prototype.recreateDc = function (...args) {
    return this._client.recreateDc(...args)
}
