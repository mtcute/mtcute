import type { tl } from '../../../../tl/index.js'
import type { ReplaceDeep } from '../../../../types/utils.js'
import type {
  InputMediaAudio,
  InputMediaPhoto,
  InputMediaVideo,
} from '../../media/index.js'

/**
 * Input rich message media, can be one of:
 * - Bot API-compatible file ID
 * - {@link InputMediaPhoto} (e.g. `InputMedia.photo(...)`)
 * - {@link InputMediaVideo} (e.g. `InputMedia.video(...)`)
 * - {@link InputMediaAudio} (e.g. `InputMedia.audio(...)`)
 * - a raw TL object
 */
export type InputRichMessageMedia
  = | string
    | tl.TypeInputPhoto
    | tl.TypeInputDocument
    | InputMediaPhoto
    | InputMediaVideo
    | InputMediaAudio

/** In-memory cache mapping an {@link InputRichMessageMedia} to its uploaded media, used by streaming drafts */
export type RichMediaUploadCache = Map<unknown, tl.RawInputMediaPhoto | tl.RawInputMediaDocument>

interface InputRichMessageBase {
  /** Whether this message should be rendered RTL */
  rtl?: boolean

  /**
   * Whether to skip automatic entities detection (e.g., URLs, email addresses,
   *  username mentions, hashtags, cashtags, bot commands, or phone numbers)
   */
  skipEntityDetection?: boolean
}

/**
 * Input rich message that is parsed by the server in the specified format
 */
export interface InputServerParsedRichMessage extends InputRichMessageBase {
  type: 'html' | 'markdown'

  /**
   * HTML or Markdown content
   *
   * Format reference is available in the Bot API:
   * - [Markdown](https://core.telegram.org/bots/api#rich-markdown-style),
   * - [HTML](https://core.telegram.org/bots/api#rich-html-style)
   *
   * In addition to the above, you can use the following links to reference non-HTTP/s media:
   * - photos: `tg://photo?id=XXX`
   * - videos/gifs: `tg://video?id=XXX`
   * - audio: `tg://audio?id=XXX`
   *
   * where XXX is a unique identifier of the media in the {@link attachments} map.
   */
  content: string

  /**
   * Attachments to the rich message.
   */
  attachments?: Record<string, InputRichMessageMedia>
}

/**
 * A convenience wrapper for the raw page blocks containing a file
 * (photo, video, document, etc.)
 *
 * You can simply pass `Long.ZERO` as the ID inside the block, and pass the
 * actual file in the `file` property, and mtcute will take care of the rest.
 */
export interface InputPageBlockWithFile {
  block: InputPageBlock
  file: InputRichMessageMedia
}

export type InputPageBlock = ReplaceDeep<tl.TypePageBlock, tl.TypePageBlock, InputPageBlockWithFile>

/**
 * A page block as accepted in a *nested* position (inside another block's
 * children, list items, etc.) — either a raw {@link tl.TypePageBlock} or
 * an {@link InputPageBlockWithFile} wrapper.
 */
export type InputPageBlockOrFile = tl.TypePageBlock | InputPageBlockWithFile

/** Input rich message that is built block-by-block */
export interface InputBlocksRichMessage extends InputRichMessageBase {
  type: 'blocks'
  /**
   * Blocks of the rich message
   */
  blocks: (InputPageBlock | InputPageBlockWithFile)[]
}

export type InputRichMessage
  = | tl.TypeInputRichMessage
    | InputBlocksRichMessage
    | InputServerParsedRichMessage
