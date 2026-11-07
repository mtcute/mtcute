import type { Message } from '@mtcute/core'
import type { TelegramClient } from '@mtcute/core/client.js'
import type { UpdateContext } from './base.js'

import { InlineWidgetQuery, SharedWidgetQuery, WidgetQuery } from '@mtcute/core'

/**
 * Context of a widget query update.
 *
 * This is a subclass of {@link WidgetQuery}, so all its fields are also available.
 */
export class WidgetQueryContext extends WidgetQuery implements UpdateContext<WidgetQuery> {
  readonly _name = 'widget_query' as const

  constructor(
    readonly client: TelegramClient,
    query: WidgetQuery,
  ) {
    super(query.raw, query._peers)
  }

  /** Answer to this widget query */
  answer(result?: string): Promise<void> {
    return this.client.answerWidgetQuery(this.id, result)
  }

  /**
   * Get the message containing the widget.
   *
   * Note that the message may have been deleted, in which case
   * `null` will be returned.
   */
  async getMessage(): Promise<Message | null> {
    const [msg] = await this.client.getMessages(this.raw.peer, this.raw.msgId)

    return msg
  }

  /** Edit state of the widget in the message the query originated from */
  editWidgetData(params: Omit<Parameters<TelegramClient['editMessageWidgetData']>[0], 'chatId' | 'message'>): Promise<void> {
    return this.client.editMessageWidgetData({
      chatId: this.raw.peer,
      message: this.raw.msgId,
      ...params,
    })
  }
}

/**
 * Context of an inline-originated widget query update.
 *
 * This is a subclass of {@link InlineWidgetQuery}, so all its fields are also available.
 */
export class InlineWidgetQueryContext extends InlineWidgetQuery implements UpdateContext<InlineWidgetQuery> {
  readonly _name = 'inline_widget_query' as const

  constructor(
    readonly client: TelegramClient,
    query: InlineWidgetQuery,
  ) {
    super(query.raw, query._peers)
  }

  /** Answer to this widget query */
  answer(result?: string): Promise<void> {
    return this.client.answerWidgetQuery(this.id, result)
  }

  /** Edit state of the widget in the inline message the query originated from */
  editWidgetData(params: Omit<Parameters<TelegramClient['editInlineMessageWidgetData']>[0], 'messageId'>): Promise<void> {
    return this.client.editInlineMessageWidgetData({
      messageId: this.raw.inlineMessageId,
      ...params,
    })
  }
}

/**
 * Context of a widget query update originated from a forwarded copy of a shared widget.
 *
 * This is a subclass of {@link SharedWidgetQuery}, so all its fields are also available.
 */
export class SharedWidgetQueryContext extends SharedWidgetQuery implements UpdateContext<SharedWidgetQuery> {
  readonly _name = 'shared_widget_query' as const

  constructor(
    readonly client: TelegramClient,
    query: SharedWidgetQuery,
  ) {
    super(query.raw, query._peers)
  }

  /** Answer to this widget query */
  answer(result?: string): Promise<void> {
    return this.client.answerWidgetQuery(this.id, result)
  }

  /** Edit shared state of the widget */
  editWidgetData(params: Omit<Parameters<TelegramClient['editSharedWidgetData']>[0], 'widgetId'>): Promise<void> {
    return this.client.editSharedWidgetData({
      widgetId: this.raw.widgetId,
      ...params,
    })
  }
}
