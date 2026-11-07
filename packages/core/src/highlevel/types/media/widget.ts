import type { tl } from '../../../tl/index.js'

import { MtArgumentError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/index.js'

/**
 * An HTML widget sent by a bot
 */
export class Widget {
  readonly type = 'widget' as const

  constructor(readonly raw: tl.RawMessageMediaWidget) {}

  /**
   * ID of the shared widget object this widget is bound to,
   * if the widget was sent as a shared one
   */
  get id(): tl.Long | null {
    return this.raw.widgetId ?? null
  }

  /** Whether this widget is a forwarded copy of the original widget */
  get isCopy(): boolean {
    return this.raw.isCopy!
  }

  /** Whether the widget can send queries to the bot (e.g. when the user taps on it) */
  get canQuery(): boolean {
    return this.raw.canQuery!
  }

  /** Whether the widget can send queries to the bot without user interaction */
  get canQueryInBackground(): boolean {
    return this.raw.backgroundQuery!
  }

  /** Width of the widget in CSS pixels, `0` meaning automatic */
  get width(): number {
    return this.raw.width
  }

  /** Height of the widget in CSS pixels, `0` meaning automatic */
  get height(): number {
    return this.raw.height
  }

  /** zlib-compressed HTML source of the widget, see {@link TelegramClient.decodeWidgetHtml} */
  get payload(): Uint8Array {
    return this.raw.payload
  }

  /** Shared state of the widget, visible in the original message and all its forwards */
  get publicData(): string | null {
    return this.raw.publicData ?? null
  }

  /** Hash of {@link publicData}, to be used in {@link TelegramClient.getWidgetPublicData} */
  get publicDataHash(): tl.Long | null {
    return this.raw.publicDataHash ?? null
  }

  /** Chat-specific state of the widget, only available in the original message */
  get chatData(): string | null {
    return this.raw.chatData ?? null
  }

  /**
   * Input media TL object generated from this object,
   * to be used inside {@link InputMediaLike} and
   * {@link TelegramClient.sendMedia}.
   *
   * Only available for shared widgets (i.e. ones with {@link id}),
   * since static widgets' HTML can't be re-sent as-is.
   */
  get inputMedia(): tl.TypeInputMedia {
    if (!this.raw.widgetId) {
      throw new MtArgumentError('Only shared widgets can provide an InputMedia')
    }

    return {
      _: 'inputMediaWidgetId',
      widgetId: this.raw.widgetId,
    }
  }
}

makeInspectable(Widget, undefined, ['inputMedia'])
