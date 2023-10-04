/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-argument */
import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
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
} from '../index'

/** @internal */
export function _parseUpdate(
    client: TelegramClient,
    update: tl.TypeUpdate | tl.TypeMessage,
    peers: PeersIndex,
): ParsedUpdate | null {
    switch (update._) {
        case 'message':
        case 'messageEmpty':
        case 'messageService':
        case 'updateNewMessage':
        case 'updateNewChannelMessage':
        case 'updateNewScheduledMessage':
            return {
                name: 'new_message',
                data: new Message(
                    client,
                    tl.isAnyMessage(update) ? update : update.message,
                    peers,
                    update._ === 'updateNewScheduledMessage',
                ),
            }
            break
        case 'updateEditMessage':
        case 'updateEditChannelMessage':
            return { name: 'edit_message', data: new Message(client, update.message, peers) }
            break
        case 'updateChatParticipant':
        case 'updateChannelParticipant':
            return { name: 'chat_member', data: new ChatMemberUpdate(client, update, peers) }
            break
        case 'updateBotInlineQuery':
            return { name: 'inline_query', data: new InlineQuery(client, update, peers) }
            break
        case 'updateBotInlineSend':
            return { name: 'chosen_inline_result', data: new ChosenInlineResult(client, update, peers) }
            break
        case 'updateBotCallbackQuery':
        case 'updateInlineBotCallbackQuery':
            return { name: 'callback_query', data: new CallbackQuery(client, update, peers) }
            break
        case 'updateMessagePoll':
            return { name: 'poll', data: new PollUpdate(client, update, peers) }
            break
        case 'updateMessagePollVote':
            return { name: 'poll_vote', data: new PollVoteUpdate(client, update, peers) }
            break
        case 'updateUserStatus':
            return { name: 'user_status', data: new UserStatusUpdate(client, update) }
            break
        case 'updateChannelUserTyping':
        case 'updateChatUserTyping':
        case 'updateUserTyping':
            return { name: 'user_typing', data: new UserTypingUpdate(client, update) }
            break
        case 'updateDeleteChannelMessages':
        case 'updateDeleteMessages':
            return { name: 'delete_message', data: new DeleteMessageUpdate(client, update) }
            break
        case 'updateReadHistoryInbox':
        case 'updateReadHistoryOutbox':
        case 'updateReadChannelInbox':
        case 'updateReadChannelOutbox':
        case 'updateReadChannelDiscussionInbox':
        case 'updateReadChannelDiscussionOutbox':
            return { name: 'history_read', data: new HistoryReadUpdate(client, update) }
            break
        case 'updateBotStopped':
            return { name: 'bot_stopped', data: new BotStoppedUpdate(client, update, peers) }
            break
        case 'updateBotChatInviteRequester':
            return { name: 'bot_chat_join_request', data: new BotChatJoinRequestUpdate(client, update, peers) }
            break
        case 'updatePendingJoinRequests':
            return { name: 'chat_join_request', data: new ChatJoinRequestUpdate(client, update, peers) }
            break
        case 'updateBotPrecheckoutQuery':
            return { name: 'pre_checkout_query', data: new PreCheckoutQuery(client, update, peers) }
            break
        case 'updateStory': {
            const story = update.story

            if (story._ === 'storyItemDeleted') {
                return { name: 'delete_story', data: new DeleteStoryUpdate(client, update, peers) }
            }

            return {
                name: 'story',
                data: new StoryUpdate(client, update, peers),
            }

            break
        }
        default:
            return null
    }
}
