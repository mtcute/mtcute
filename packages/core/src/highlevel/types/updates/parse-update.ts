/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-argument */
import { tl } from '@mtcute/tl'

import {
    BotChatJoinRequestUpdate,
    BotReactionCountUpdate,
    BotReactionUpdate,
    BotStoppedUpdate,
    BusinessCallbackQuery,
    BusinessConnection,
    BusinessMessage,
    CallbackQuery,
    ChatJoinRequestUpdate,
    ChatMemberUpdate,
    ChosenInlineResult,
    DeleteBusinessMessageUpdate,
    DeleteMessageUpdate,
    DeleteStoryUpdate,
    HistoryReadUpdate,
    InlineCallbackQuery,
    InlineQuery,
    Message,
    ParsedUpdate,
    PeersIndex,
    PollUpdate,
    PollVoteUpdate,
    PreCheckoutQuery,
    StoryUpdate,
    UserStatusUpdate,
    UserTypingUpdate,
} from '../index.js'

/** @internal */
export function _parseUpdate(update: tl.TypeUpdate, peers: PeersIndex): ParsedUpdate | null {
    switch (update._) {
        case 'updateNewMessage':
        case 'updateNewChannelMessage':
        case 'updateNewScheduledMessage':
            return {
                name: 'new_message',
                data: new Message(update.message, peers, update._ === 'updateNewScheduledMessage'),
            }
        case 'updateEditMessage':
        case 'updateEditChannelMessage':
            return { name: 'edit_message', data: new Message(update.message, peers) }
        case 'updateChatParticipant':
        case 'updateChannelParticipant':
            return { name: 'chat_member', data: new ChatMemberUpdate(update, peers) }
        case 'updateBotInlineQuery':
            return { name: 'inline_query', data: new InlineQuery(update, peers) }
        case 'updateBotInlineSend':
            return { name: 'chosen_inline_result', data: new ChosenInlineResult(update, peers) }
        case 'updateBotCallbackQuery':
            return { name: 'callback_query', data: new CallbackQuery(update, peers) }
        case 'updateInlineBotCallbackQuery':
            return { name: 'inline_callback_query', data: new InlineCallbackQuery(update, peers) }
        case 'updateMessagePoll':
            return { name: 'poll', data: new PollUpdate(update, peers) }
        case 'updateMessagePollVote':
            return { name: 'poll_vote', data: new PollVoteUpdate(update, peers) }
        case 'updateUserStatus':
            return { name: 'user_status', data: new UserStatusUpdate(update) }
        case 'updateChannelUserTyping':
        case 'updateChatUserTyping':
        case 'updateUserTyping':
            return { name: 'user_typing', data: new UserTypingUpdate(update) }
        case 'updateDeleteChannelMessages':
        case 'updateDeleteMessages':
            return { name: 'delete_message', data: new DeleteMessageUpdate(update) }
        case 'updateReadHistoryInbox':
        case 'updateReadHistoryOutbox':
        case 'updateReadChannelInbox':
        case 'updateReadChannelOutbox':
        case 'updateReadChannelDiscussionInbox':
        case 'updateReadChannelDiscussionOutbox':
            return { name: 'history_read', data: new HistoryReadUpdate(update) }
        case 'updateBotStopped':
            return { name: 'bot_stopped', data: new BotStoppedUpdate(update, peers) }
        case 'updateBotChatInviteRequester':
            return { name: 'bot_chat_join_request', data: new BotChatJoinRequestUpdate(update, peers) }
        case 'updatePendingJoinRequests':
            return { name: 'chat_join_request', data: new ChatJoinRequestUpdate(update, peers) }
        case 'updateBotPrecheckoutQuery':
            return { name: 'pre_checkout_query', data: new PreCheckoutQuery(update, peers) }
        case 'updateStory': {
            const story = update.story

            if (story._ === 'storyItemDeleted') {
                return { name: 'delete_story', data: new DeleteStoryUpdate(update, peers) }
            }

            return {
                name: 'story',
                data: new StoryUpdate(update, peers),
            }
        }
        case 'updateBotMessageReaction':
            return { name: 'bot_reaction', data: new BotReactionUpdate(update, peers) }
        case 'updateBotMessageReactions':
            return { name: 'bot_reaction_count', data: new BotReactionCountUpdate(update, peers) }
        case 'updateBotBusinessConnect':
            return { name: 'business_connection', data: new BusinessConnection(update.connection, peers) }
        case 'updateBotNewBusinessMessage':
            return { name: 'new_business_message', data: new BusinessMessage(update, peers) }
        case 'updateBotEditBusinessMessage':
            return { name: 'edit_business_message', data: new BusinessMessage(update, peers) }
        case 'updateBotDeleteBusinessMessage':
            return { name: 'delete_business_message', data: new DeleteBusinessMessageUpdate(update, peers) }
        case 'updateBusinessBotCallbackQuery':
            return { name: 'business_callback_query', data: new BusinessCallbackQuery(update, peers) }
        default:
            return null
    }
}
