import type { tl } from '@mtcute/tl'

/**
 * Reply keyboard markup
 */
export interface ReplyKeyboardMarkup extends Omit<tl.RawReplyKeyboardMarkup, '_' | 'rows'> {
  readonly type: 'reply'

  /**
   * Two-dimensional array of buttons
   */
  readonly buttons: tl.TypeKeyboardButton[][]
}

/**
 * Hide previously sent bot keyboard
 */
export interface ReplyKeyboardHide extends Omit<tl.RawReplyKeyboardHide, '_'> {
  readonly type: 'reply_hide'
}

/**
 * Force the user to send a reply
 */
export interface ReplyKeyboardForceReply extends Omit<tl.RawReplyKeyboardForceReply, '_'> {
  readonly type: 'force_reply'
}

/**
 * Inline keyboard markup
 */
export interface InlineKeyboardMarkup {
  readonly type: 'inline'

  /**
   * Two-dimensional array of buttons
   */
  readonly buttons: tl.TypeKeyboardButton[][]
}

export type ReplyMarkup
  = | ReplyKeyboardMarkup
    | ReplyKeyboardHide
    | ReplyKeyboardForceReply
    | InlineKeyboardMarkup
    | tl.TypeReplyMarkup
