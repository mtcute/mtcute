/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-argument */
import { tl } from '@mtcute/core'

import {
    BotChatJoinRequestUpdate,
    BotStoppedUpdate,
    CallbackQuery,
    ChatJoinRequestUpdate,
    ChatMemberUpdate,
    ChosenInlineResult,
    DeleteMessageUpdate,
    DeleteStoryUpdate,
    HistoryReadUpdate,
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
        case 'updateInlineBotCallbackQuery':
            return { name: 'callback_query', data: new CallbackQuery(update, peers) }
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
        default:
            return null
    }
}
