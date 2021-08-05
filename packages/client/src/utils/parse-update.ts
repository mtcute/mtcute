import { TelegramClient } from '../client'
import { tl } from '@mtcute/tl'
import {
    BotStoppedUpdate,
    CallbackQuery,
    ChatMemberUpdate,
    ChatsIndex,
    ChosenInlineResult,
    DeleteMessageUpdate,
    HistoryReadUpdate,
    InlineQuery,
    Message,
    ParsedUpdate,
    PollUpdate,
    PollVoteUpdate,
    UsersIndex,
    UserStatusUpdate,
    UserTypingUpdate,
} from '../types'

type ParserFunction = (
    client: TelegramClient,
    upd: tl.TypeUpdate | tl.TypeMessage,
    users: UsersIndex,
    chats: ChatsIndex
) => any
type UpdateParser = [ParsedUpdate['name'], ParserFunction]

const baseMessageParser: ParserFunction = (
    client: TelegramClient,
    upd,
    users,
    chats
) =>
    new Message(
        client,
        tl.isAnyMessage(upd) ? upd : (upd as any).message,
        users,
        chats,
        upd._ === 'updateNewScheduledMessage'
    )

const newMessageParser: UpdateParser = ['new_message', baseMessageParser]
const editMessageParser: UpdateParser = ['edit_message', baseMessageParser]
const chatMemberParser: UpdateParser = [
    'chat_member',
    (client, upd, users, chats) =>
        new ChatMemberUpdate(client, upd as any, users, chats),
]
const callbackQueryParser: UpdateParser = [
    'callback_query',
    (client, upd, users) => new CallbackQuery(client, upd as any, users),
]
const userTypingParser: UpdateParser = [
    'user_typing',
    (client, upd) => new UserTypingUpdate(client, upd as any),
]
const deleteMessageParser: UpdateParser = [
    'delete_message',
    (client, upd) => new DeleteMessageUpdate(client, upd as any),
]
const historyReadParser: UpdateParser = [
    'history_read',
    (client, upd) => new HistoryReadUpdate(client, upd as any),
]

const PARSERS: Partial<
    Record<(tl.TypeUpdate | tl.TypeMessage)['_'], UpdateParser>
> = {
    message: newMessageParser,
    messageEmpty: newMessageParser,
    messageService: newMessageParser,
    updateNewMessage: newMessageParser,
    updateNewChannelMessage: newMessageParser,
    updateNewScheduledMessage: newMessageParser,
    updateEditMessage: editMessageParser,
    updateEditChannelMessage: editMessageParser,
    updateChatParticipant: chatMemberParser,
    updateChannelParticipant: chatMemberParser,
    updateBotInlineQuery: [
        'inline_query',
        (client, upd, users) => new InlineQuery(client, upd as any, users),
    ],
    updateBotInlineSend: [
        'chosen_inline_result',
        (client, upd, users) =>
            new ChosenInlineResult(client, upd as any, users),
    ],
    updateBotCallbackQuery: callbackQueryParser,
    updateInlineBotCallbackQuery: callbackQueryParser,
    updateMessagePoll: [
        'poll',
        (client, upd, users) => new PollUpdate(client, upd as any, users),
    ],
    updateMessagePollVote: [
        'poll_vote',
        (client, upd, users) => new PollVoteUpdate(client, upd as any, users),
    ],
    updateUserStatus: [
        'user_status',
        (client, upd) => new UserStatusUpdate(client, upd as any),
    ],
    updateChannelUserTyping: userTypingParser,
    updateChatUserTyping: userTypingParser,
    updateUserTyping: userTypingParser,
    updateDeleteChannelMessages: deleteMessageParser,
    updateDeleteMessages: deleteMessageParser,
    updateReadHistoryInbox: historyReadParser,
    updateReadHistoryOutbox: historyReadParser,
    updateReadChannelInbox: historyReadParser,
    updateReadChannelOutbox: historyReadParser,
    updateReadChannelDiscussionInbox: historyReadParser,
    updateReadChannelDiscussionOutbox: historyReadParser,
    updateBotStopped: [
        'bot_stopped',
        (client, upd, users) => new BotStoppedUpdate(client, upd as any, users),
    ],
}

/** @internal */
export function _parseUpdate(
    client: TelegramClient,
    update: tl.TypeUpdate | tl.TypeMessage,
    users: UsersIndex,
    chats: ChatsIndex
): ParsedUpdate | null {
    const pair = PARSERS[update._]
    if (pair) {
        return {
            name: pair[0],
            data: pair[1](client, update, users, chats),
        }
    } else {
        return null
    }
}
