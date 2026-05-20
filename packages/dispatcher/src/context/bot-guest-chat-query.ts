import type { ParametersSkip1 } from '@mtcute/core'
import type { TelegramClient } from '@mtcute/core/client.js'
import type { UpdateContext } from './base.js'

import { BotGuestChatQuery } from '@mtcute/core'

/**
 * Context of a bot guest chat query update.
 *
 * This is a subclass of {@link BotGuestChatQuery}, so all its fields are also available.
 */
export class BotGuestChatQueryContext extends BotGuestChatQuery implements UpdateContext<BotGuestChatQuery> {
  readonly _name = 'bot_guest_chat_query' as const

  constructor(
    readonly client: TelegramClient,
    query: BotGuestChatQuery,
  ) {
    super(query.raw, query._peers)
  }

  /** Answer this query with a single result */
  answer(...params: ParametersSkip1<TelegramClient['answerBotGuestChatQuery']>): ReturnType<TelegramClient['answerBotGuestChatQuery']> {
    return this.client.answerBotGuestChatQuery(this.id, ...params)
  }
}
