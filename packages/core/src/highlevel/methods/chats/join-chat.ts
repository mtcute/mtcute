import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import { tl } from '../../../tl/index.js'
import { Chat, PeersIndex, User } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { INVITE_LINK_REGEX } from '../../utils/peer-utils.js'
import { resolveChannel } from '../users/resolve-peer.js'

// @exported
/**
 * Result of {@link joinChat}
 *
 * - `status: 'ok'` - the chat was joined successfully
 * - `status: 'request_sent'` - a join request was sent and needs to be approved by the chat admin
 * - `status: 'webview'` - a guard bot requested you to open a webview before joining the chat
 *   (use `messages.requestChatJoinWebView` with `queryId` to obtain the webview url)
 */
export type JoinChatResult
  = | { status: 'ok', chat: Chat }
    | { status: 'request_sent' }
    | { status: 'webview', bot: User, queryId: tl.Long }

/**
 * Join a channel or supergroup
 *
 * @param chatId
 *   Chat identifier. Either an invite link (`t.me/joinchat/*`), a username (`@username`)
 *   or ID of the linked supergroup or channel.
 */
export async function joinChat(client: ITelegramClient, chatId: InputPeerLike): Promise<JoinChatResult> {
  let res: tl.messages.TypeChatInviteJoinResult | undefined
  try {
    if (typeof chatId === 'string') {
      const m = chatId.match(INVITE_LINK_REGEX)

      if (m) {
        res = await client.call({
          _: 'messages.importChatInvite',
          hash: m[1],
        })
      }
    }
    if (!res) {
      res = await client.call({
        _: 'channels.joinChannel',
        channel: await resolveChannel(client, chatId),
      })
    }
  } catch (e) {
    if (tl.RpcError.is(e, 'INVITE_REQUEST_SENT')) {
      return { status: 'request_sent' }
    } else {
      throw e
    }
  }

  switch (res._) {
    case 'messages.chatInviteJoinResultOk':
      assertIsUpdatesGroup('joinChat', res.updates)
      client.handleClientUpdate(res.updates)

      return { status: 'ok', chat: new Chat(res.updates.chats[0]) }
    case 'messages.chatInviteJoinResultWebView': {
      const peers = PeersIndex.from(res)
      return {
        status: 'webview',
        bot: new User(peers.user(res.botId)),
        queryId: res.queryId,
      }
    }
  }
}
