import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { BotChatJoinRequestUpdate } from '../../types/updates/bot-chat-join-request.js'
import Long from 'long'
import { MtArgumentError } from '../../../types/errors.js'
import { assertTrue } from '../../../utils/type-assertions.js'

// @exported
/**
 * Decision of a guard bot about a chat join request
 *
 * - `approve` - allow the user to join the chat
 * - `decline` - decline the request
 * - `queue` - leave the request for chat admins to review
 * - `webview` - require the user to open the bot's mini app at `url`,
 *   after which the query should be answered again with the final decision
 */
export type ChatJoinRequestQueryAnswer
  = | { action: 'approve' | 'decline' | 'queue' }
    | { action: 'webview', url: string }

/**
 * Answer a chat join request query received by a guard bot
 * (see {@link BotChatJoinRequestUpdate.queryId})
 *
 * @param queryId  ID of the query, or the join request update itself
 * @param answer  Decision about the join request
 */
export async function answerChatJoinRequestQuery(
  client: ITelegramClient,
  queryId: tl.Long | BotChatJoinRequestUpdate,
  answer: ChatJoinRequestQueryAnswer,
): Promise<void> {
  let id: tl.Long
  if (Long.isLong(queryId)) {
    id = queryId
  } else {
    if (!queryId.queryId) {
      throw new MtArgumentError('This join request has no query to answer')
    }

    id = queryId.queryId
  }

  let result: tl.TypeJoinChatBotResult
  switch (answer.action) {
    case 'approve':
      result = { _: 'joinChatBotResultApproved' }
      break
    case 'decline':
      result = { _: 'joinChatBotResultDeclined' }
      break
    case 'queue':
      result = { _: 'joinChatBotResultQueued' }
      break
    case 'webview':
      result = { _: 'joinChatBotResultWebView', url: answer.url }
      break
  }

  const r = await client.call({
    _: 'bots.setJoinChatResults',
    queryId: id,
    result,
  })

  assertTrue('bots.setJoinChatResults', r)
}
