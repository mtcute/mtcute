/* eslint-disable @typescript-eslint/no-unused-vars */
// @copy
import { Readable } from 'stream'

// @copy
import { MaybeArray, MaybeAsync } from '@mtcute/core'
// @copy
import {
    AsyncLock,
    ConditionVariable,
    Deque,
    Logger,
    SortedLinkedList,
} from '@mtcute/core/utils'
// @copy
import { tdFileId } from '@mtcute/file-id'

// @copy
import {
    ArrayWithTotal,
    BotChatJoinRequestUpdate,
    BotCommands,
    BotStoppedUpdate,
    CallbackQuery,
    Chat,
    ChatAction,
    ChatEvent,
    ChatInviteLink,
    ChatInviteLinkJoinedMember,
    ChatJoinRequestUpdate,
    ChatMember,
    ChatMemberUpdate,
    ChatPreview,
    ChosenInlineResult,
    Conversation,
    DeleteMessageUpdate,
    Dialog,
    FileDownloadParameters,
    FormattedString,
    GameHighScore,
    HistoryReadUpdate,
    IMessageEntityParser,
    InlineQuery,
    InputFileLike,
    InputInlineResult,
    InputMediaLike,
    InputPeerLike,
    InputStickerSetItem,
    MaybeDynamic,
    Message,
    MessageEntity,
    MessageMedia,
    MessageReactions,
    ParsedUpdate,
    PartialExcept,
    PartialOnly,
    PeerReaction,
    PeersIndex,
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
    TakeoutSession,
    TermsOfService,
    TypingStatus,
    UploadedFile,
    UploadFileLike,
    User,
    UserStatusUpdate,
    UserTypingUpdate,
} from '../types'
