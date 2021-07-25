/* eslint-disable @typescript-eslint/no-unused-vars */

// @copy
import { Readable } from 'stream'

// @copy
import {
    User,
    Chat,
    ChatPreview,
    ChatMember,
    Dialog,
    TermsOfService,
    SentCode,
    MaybeDynamic,
    InputPeerLike,
    UploadedFile,
    UploadFileLike,
    InputFileLike,
    PartialExcept,
    PartialOnly,
    FileDownloadParameters,
    Message,
    ReplyMarkup,
    InputMediaLike,
    InputInlineResult,
    InputStickerSetItem,
    TakeoutSession,
    StickerSet,
    Poll,
    TypingStatus,
    Photo,
    ChatEvent,
    ChatInviteLink,
    UsersIndex,
    ChatsIndex,
    GameHighScore,
    ArrayWithTotal,
    BotCommands,
    MessageMedia,
    RawDocument,
    IMessageEntityParser,
    FormattedString,
    CallbackQuery,
    ChatMemberUpdate,
    ChosenInlineResult,
    DeleteMessageUpdate,
    HistoryReadUpdate,
    InlineQuery,
    ParsedUpdate,
    PollUpdate,
    PollVoteUpdate,
    UserStatusUpdate,
    UserTypingUpdate,
    Conversation
} from '../types'

// @copy
import {
    MaybeArray,
    MaybeAsync,
    TelegramConnection,
    AsyncLock,
} from '@mtqt/core'

// @copy
import { tdFileId } from '@mtqt/file-id'
