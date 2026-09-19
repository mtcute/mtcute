import type { tl } from '../../../tl/index.js'

import type { PeersIndex } from '../peers/index.js'
import { getBarePeerId, getMarkedPeerId } from '../../../utils/peer-utils.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Chat } from '../peers/index.js'

/**
 * A guard bot has made a decision about the current user's
 * request to join a chat (see {@link TelegramClient.openJoinChatWebview}).
 *
 * If the webview of the guard bot is still open, it should be closed.
 */
export class ChatJoinResultUpdate {
  constructor(
    readonly raw: tl.RawUpdateJoinChatWebViewDecision,
    readonly _peers: PeersIndex,
  ) {}

  /** ID of the join query, as returned by {@link TelegramClient.joinChat} */
  get queryId(): tl.Long {
    return this.raw.queryId
  }

  /** Marked ID of the chat the user was requesting to join */
  get chatId(): number {
    return getMarkedPeerId(this.raw.peer)
  }

  /** The chat the user was requesting to join, if available */
  get chat(): Chat | null {
    if (!this._peers.has(this.raw.peer)) return null

    return new Chat(this._peers.chat(getBarePeerId(this.raw.peer)))
  }

  /**
   * Decision of the guard bot
   *
   * - `approved` - the user has joined the chat
   * - `declined` - the request was declined
   * - `queued` - the request was sent to chat admins for review
   * - `webview` - the user must open the bot's mini app (see {@link webviewUrl})
   */
  get result(): 'approved' | 'declined' | 'queued' | 'webview' {
    switch (this.raw.result._) {
      case 'joinChatBotResultApproved':
        return 'approved'
      case 'joinChatBotResultDeclined':
        return 'declined'
      case 'joinChatBotResultQueued':
        return 'queued'
      case 'joinChatBotResultWebView':
        return 'webview'
    }
  }

  /** If {@link result} is `webview`, URL of the mini app to open */
  get webviewUrl(): string | null {
    return this.raw.result._ === 'joinChatBotResultWebView' ? this.raw.result.url : null
  }
}

memoizeGetters(ChatJoinResultUpdate, ['chat'])
makeInspectable(ChatJoinResultUpdate)
