import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'

import type { InputInlineResult } from '../../types/bots/inline-result/types.js'
import type { InputPeerLike } from '../../types/index.js'
import { objectKeys } from '@fuman/utils'
import { assertNever } from '../../../types/utils.js'
import { BotInline } from '../../types/index.js'
import { resolveUser } from '../users/resolve-peer.js'

/**
 * Prepare an inline message result to be sent later via the
 * `shareMessage` [mini-app api method](https://core.telegram.org/bots/webapps#initializing-mini-apps).
 */
export async function prepareInlineMessage(
  client: ITelegramClient,
  params: {
    userId: InputPeerLike
    result: InputInlineResult

    /**
     * Filters for the client to use when prompting the user for the
     * chat to send the inline message to.
     *
     * Note that this is just a hint for the client, and the client is free to ignore it.
     */
    filter?: tl.TypeInlineQueryPeerType[] | {
      /** private chat with the bot itself */
      botSelf?: boolean
      /** private chats */
      private?: boolean
      /** private chats with other bots */
      bots?: boolean
      /** "basic" chats */
      chats?: boolean
      /** supergroups */
      supergroups?: boolean
      /** broadcast channels */
      channels?: boolean
    }
  },
): Promise<tl.messages.TypeBotPreparedInlineMessage> {
  let peerTypes: tl.TypeInlineQueryPeerType[] | undefined

  if (params.filter) {
    if (Array.isArray(params.filter)) {
      peerTypes = params.filter
    } else {
      peerTypes = []

      for (const key of objectKeys(params.filter)) {
        if (!params.filter[key]) continue
        switch (key) {
          case 'botSelf':
            peerTypes.push({ _: 'inlineQueryPeerTypeBotPM' })
            break
          case 'private':
            peerTypes.push({ _: 'inlineQueryPeerTypePM' })
            break
          case 'bots':
            peerTypes.push({ _: 'inlineQueryPeerTypeBroadcast' })
            break
          case 'chats':
            peerTypes.push({ _: 'inlineQueryPeerTypeChat' })
            break
          case 'supergroups':
            peerTypes.push({ _: 'inlineQueryPeerTypeMegagroup' })
            break
          case 'channels':
            peerTypes.push({ _: 'inlineQueryPeerTypeBroadcast' })
            break
          default:
            assertNever(key)
        }
      }
    }
  }

  const [, tlResult] = await BotInline._convertToTl(client, [params.result])

  return client.call({
    _: 'messages.savePreparedInlineMessage',
    userId: await resolveUser(client, params.userId),
    result: tlResult[0],
    peerTypes,
  })
}
