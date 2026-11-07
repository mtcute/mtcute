import type { tl } from '../../../tl/index.js'
import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'

import { utf8 } from '@fuman/utils'
import { makeInspectable } from '../../utils/index.js'
import { encodeInlineMessageId } from '../../utils/inline-utils.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer } from '../peers/peer.js'
import { User } from '../peers/user.js'

/** TON wallet used by the user's device to sign data or send a transaction */
export interface WidgetQueryWallet {
  /** Address of the wallet */
  address: string
  /** Balance of the wallet, in nanotons */
  balance: tl.Long
  /** Public key of the wallet */
  publicKey: Uint8Array | null
  /** StateInit of the wallet, serialized as a bag of cells */
  stateInit: Uint8Array | null
}

/**
 * Type of a widget query:
 *  - `data`: a regular query with {@link BaseWidgetQuery.data}. If `withWallet` is set,
 *    the user asked to share their wallet, see {@link BaseWidgetQuery.profileWallet}
 *  - `sign_data`: the user signed TON Connect `signData` payload, `signData` contains its result
 *  - `sent_transaction`: the user sent a TON transaction, `messageHash` contains its normalized message hash
 */
export type WidgetQueryType
  = | { type: 'data', withWallet: boolean }
    | { type: 'sign_data', wallet: WidgetQueryWallet, signData: unknown }
    | { type: 'sent_transaction', wallet: WidgetQueryWallet, messageHash: string }

/** @internal */
export function _widgetQueryTypeFromTl(raw: tl.TypeWidgetQueryType): WidgetQueryType {
  if (raw._ === 'widgetQueryTypeData') {
    return { type: 'data', withWallet: raw.withWallet! }
  }

  const wallet: WidgetQueryWallet = {
    address: raw.wallet.address,
    balance: raw.wallet.balance,
    publicKey: raw.wallet.publicKey ?? null,
    stateInit: raw.wallet.stateInit ?? null,
  }

  if (raw._ === 'widgetQueryTypeSignData') {
    return { type: 'sign_data', wallet, signData: JSON.parse(raw.signData.data) }
  }

  return { type: 'sent_transaction', wallet, messageHash: raw.msgHash }
}

/** Base class for widget queries */
class BaseWidgetQuery {
  constructor(
    readonly raw:
      | tl.RawUpdateBotWidgetQuery
      | tl.RawUpdateInlineBotWidgetQuery
      | tl.RawUpdateBotWidgetCopyQuery,
    readonly _peers: PeersIndex,
  ) {}

  /** ID of this query, to be used in {@link TelegramClient.answerWidgetQuery} */
  get id(): tl.Long {
    return this.raw.queryId
  }

  /** User who has sent the query */
  get user(): User {
    return new User(this._peers.user(this.raw.userId))
  }

  /** Type of the query */
  get type(): WidgetQueryType {
    return _widgetQueryTypeFromTl(this.raw.queryType)
  }

  /**
   * Data sent by the widget
   *
   * Note that this field is defined by the widget running on the client,
   * and a bad client can send arbitrary data in this field.
   */
  get data(): Uint8Array {
    return this.raw.data
  }

  /** {@link data} parsed as a UTF8 string */
  get dataStr(): string {
    return utf8.decoder.decode(this.raw.data)
  }

  /**
   * Wallet from the user's profile, only available when
   * the widget explicitly asked for it (see {@link WidgetQueryType})
   */
  get profileWallet(): tl.wallet.TypeCard | null {
    return this.raw.walletCard ?? null
  }
}

/**
 * A widget query originating from a normal message sent by the bot
 */
export class WidgetQuery extends BaseWidgetQuery {
  constructor(
    override readonly raw: tl.RawUpdateBotWidgetQuery,
    _peers: PeersIndex,
  ) {
    super(raw, _peers)
  }

  /** Chat where the widget message was sent */
  get chat(): Peer {
    return parsePeer(this.raw.peer, this._peers)
  }

  /** ID of the message containing the widget */
  get messageId(): number {
    return this.raw.msgId
  }

  /**
   * Unique ID, that represents the chat to which the message
   * was sent. Does *not* contain actual chat ID.
   */
  get uniqueChatId(): tl.Long {
    return this.raw.chatInstance
  }

  /** Type of the chat where the widget message was sent */
  get chatType(): string {
    return this.raw.chatType
  }

  /** ID of the shared widget, if the widget is a shared one */
  get widgetId(): tl.Long | null {
    return this.raw.widgetId ?? null
  }
}

memoizeGetters(WidgetQuery, ['user', 'type', 'dataStr', 'chat'])
makeInspectable(WidgetQuery)

/**
 * A widget query originating from an inline message sent via the bot
 */
export class InlineWidgetQuery extends BaseWidgetQuery {
  constructor(
    override readonly raw: tl.RawUpdateInlineBotWidgetQuery,
    _peers: PeersIndex,
  ) {
    super(raw, _peers)
  }

  /**
   * Identifier of the inline message containing the widget.
   * Can be used in {@link TelegramClient.editInlineMessageWidgetData}
   */
  get inlineMessageId(): tl.TypeInputBotInlineMessageID {
    return this.raw.inlineMessageId
  }

  /**
   * {@link inlineMessageId} as a TDLib and Bot API compatible string
   */
  get inlineMessageIdStr(): string {
    return encodeInlineMessageId(this.raw.inlineMessageId)
  }

  /**
   * Unique ID, that represents the chat to which the inline
   * message was sent. Does *not* contain actual chat ID.
   */
  get uniqueChatId(): tl.Long {
    return this.raw.chatInstance
  }

  /** Type of the chat where the inline message was sent */
  get chatType(): string {
    return this.raw.chatType
  }

  /** ID of the shared widget, if the widget is a shared one */
  get widgetId(): tl.Long | null {
    return this.raw.widgetId ?? null
  }
}

memoizeGetters(InlineWidgetQuery, ['user', 'type', 'dataStr', 'inlineMessageIdStr'])
makeInspectable(InlineWidgetQuery)

/**
 * A widget query originating from a forwarded copy of a shared widget.
 *
 * Contains no information about the chat or message the widget was in.
 */
export class SharedWidgetQuery extends BaseWidgetQuery {
  constructor(
    override readonly raw: tl.RawUpdateBotWidgetCopyQuery,
    _peers: PeersIndex,
  ) {
    super(raw, _peers)
  }

  /** ID of the shared widget */
  get widgetId(): tl.Long {
    return this.raw.widgetId
  }
}

memoizeGetters(SharedWidgetQuery, ['user', 'type', 'dataStr'])
makeInspectable(SharedWidgetQuery)
