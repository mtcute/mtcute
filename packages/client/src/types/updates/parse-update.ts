import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import {
    BotChatJoinRequestUpdate,
    BotStoppedUpdate,
    CallbackQuery,
    ChatJoinRequestUpdate,
    ChatMemberUpdate,
    ChosenInlineResult,
    DeleteMessageUpdate,
    HistoryReadUpdate,
    InlineQuery,
    Message,
    ParsedUpdate,
    PeersIndex,
    PollUpdate,
    PollVoteUpdate,
    UserStatusUpdate,
    UserTypingUpdate,
    PreCheckoutQuery
} from '../index'

type ParserFunction = (
    client: TelegramClient,
    upd: tl.TypeUpdate | tl.TypeMessage,
    peers: PeersIndex
) => any
type UpdateParser = [ParsedUpdate['name'], ParserFunction]

const baseMessageParser: ParserFunction = (
    client: TelegramClient,
    upd,
    peers
) =>
    new Message(
        client,
        tl.isAnyMessage(upd) ? upd : (upd as any).message,
        peers,
        upd._ === 'updateNewScheduledMessage'
    )

const newMessageParser: UpdateParser = ['new_message', baseMessageParser]
const editMessageParser: UpdateParser = ['edit_message', baseMessageParser]
const chatMemberParser: UpdateParser = [
    'chat_member',
    (client, upd, peers) => new ChatMemberUpdate(client, upd as any, peers),
]
const callbackQueryParser: UpdateParser = [
    'callback_query',
    (client, upd, peers) => new CallbackQuery(client, upd as any, peers),
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
        (client, upd, peers) => new InlineQuery(client, upd as any, peers),
    ],
    updateBotInlineSend: [
        'chosen_inline_result',
        (client, upd, peers) =>
            new ChosenInlineResult(client, upd as any, peers),
    ],
    updateBotCallbackQuery: callbackQueryParser,
    updateInlineBotCallbackQuery: callbackQueryParser,
    updateMessagePoll: [
        'poll',
        (client, upd, peers) => new PollUpdate(client, upd as any, peers),
    ],
    updateMessagePollVote: [
        'poll_vote',
        (client, upd, peers) => new PollVoteUpdate(client, upd as any, peers),
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
        (client, upd, peers) => new BotStoppedUpdate(client, upd as any, peers),
    ],
    updateBotChatInviteRequester: [
        'bot_chat_join_request',
        (client, upd, peers) =>
            new BotChatJoinRequestUpdate(client, upd as any, peers),
    ],
    updatePendingJoinRequests: [
        'chat_join_request',
        (client, upd, peers) =>
            new ChatJoinRequestUpdate(client, upd as any, peers),
    ],
    updateBotPrecheckoutQuery: [
        'pre_checkout_query',
        (client, upd, peers) => new PreCheckoutQuery(client, upd as any, peers),
    ]
}

/** @internal */
export function _parseUpdate(
    client: TelegramClient,
    update: tl.TypeUpdate | tl.TypeMessage,
    peers: PeersIndex
): ParsedUpdate | null {
    const pair = PARSERS[update._]
    if (pair) {
        return {
            name: pair[0],
            data: pair[1](client, update, peers),
        }
    } else {
        return null
    }
}
