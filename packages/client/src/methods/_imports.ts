/* eslint-disable @typescript-eslint/no-unused-vars */

// @copy
import { IMessageEntityParser } from '../parser'

// @copy
import { Readable } from 'stream'

// @copy
import {
    User,
    Chat,
    ChatPreview,
    ChatMember,
    Dialog,
    InputChatPermissions,
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
    Poll
} from '../types'

// @copy
import { MaybeArray, MaybeAsync, TelegramConnection } from '@mtcute/core'

// @copy
import { Lock } from '../utils/lock'

// @copy
import { tdFileId } from '@mtcute/file-id'
