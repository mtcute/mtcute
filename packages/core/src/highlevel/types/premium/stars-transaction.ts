import type { tl } from '@mtcute/tl'

import type { PeersIndex } from '../peers/peers-index.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import type { Peer } from '../peers/peer.js'
import { parsePeer } from '../peers/peer.js'
import type { User } from '../peers/user.js'
import { type MessageMedia, _messageMediaFromTl } from '../messages/message-media.js'
import { WebDocument } from '../files/web-document.js'

// ref: https://github.com/tdlib/td/blob/master/td/telegram/StarManager.cpp#L223

/**
 * Type of the transaction.
 *
 *  - `unsupported`: This transaction is not supported by the current version of client
 *  - `app_store`, `play_market`, `premium_bot`, `fragment`: This transaction is a purchase
 *    through App Store, Play Market, Premium Bot or Fragment respectively
 *  - `fragment_withdraw`: This transaction is a withdrawal via Fragment
 *  - `ads`: This transaction is with the Telegram Ads platform
 *  - `reaction`: This transaction is a paid reaction in a chat
 *  - `gift`: This transaction is a gift from a user
 *  - `bot_purchase`: This transaction is a purchase at a bot-operated store
 *  - `channel_subscription`: This transaction is a subscription to a channel
 */
export type StarsTransactionType =
  | { type: 'unsupported' }
  | { type: 'app_store' }
  | { type: 'play_market' }
  | { type: 'premium_bot' }
  | { type: 'fragment' }
  | {
      type: 'fragment_withdraw'
      status: 'pending' | 'success' | 'failed'
      /** If successful, date of the withdrawal */
      date?: Date
      /** If successful, URL of the withdrawal transaction */
      url?: string
  }
  | { type: 'ads' }
  | {
      type: 'reaction'
      /**
       * Related peer
       *
       * - For incoming transactions - user who sent the reaction
       * - For outgoing transactions - channel which received the reaction
       */
      peer: Peer
      /** ID of the message containing the reaction */
      messageId: number
  }
  | {
      type: 'gift'
      /** User who sent the gift */
      user: User
  }
  | {
      type: 'media_purchase'
      /**
       * Related peer
       *
       * - For incoming transactions - user who bought the media
       * - For outgoing transactions - seller of the media
       */
      peer: Peer
      /** ID of the message containing the media */
      messageId: number
      /** The bought media (available if not refunded) */
      media?: MessageMedia[]
  }
  | {
      type: 'bot_purchase'

      /**
       * Related user
       *
       * - For incoming transactions - user who bought the item
       * - For outgoing transactions - the seller bot
       */
      user: User

      /** Photo of the item, if available */
      photo?: WebDocument

      /** Title of the item */
      title: string

      /** Description of the item */
      description?: string

      /** Custom payload of the item */
      payload?: Uint8Array
  }
  | {
      type: 'channel_subscription'
      /**
       * Related peer
       *
       * - For incoming transactions - user who subscribed to the channel
       * - For outgoing transactions - channel which was subscribed to
       */
      peer: Peer

      /** Period of the subscription, in seconds */
      period: number
  }

export class StarsTransaction {
    constructor(
        readonly raw: tl.RawStarsTransaction,
        readonly peers: PeersIndex,
    ) {}

    /** ID of the transaction */
    get id(): string {
        return this.raw.id
    }

    /** Whether this transaction is a refund */
    get isRefund(): boolean {
        return this.raw.refund!
    }

    /**
     * Whether this transaction is outgoing or incoming
     */
    get direction(): 'incoming' | 'outgoing' {
        let isNegative = this.raw.stars.isNegative()
        if (this.raw.refund) isNegative = !isNegative

        return isNegative ? 'outgoing' : 'incoming'
    }

    /** Absolute amount of stars in the transaction */
    get amount(): tl.Long {
        let res = this.raw.stars

        if (res.isNegative()) {
            res = res.negate()
        }

        return res
    }

    /** Date of the transaction */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /** Type of this transaction */
    get type(): StarsTransactionType {
        switch (this.raw.peer._) {
            case 'starsTransactionPeerAppStore':
                return { type: 'app_store' }
            case 'starsTransactionPeerPlayMarket':
                return { type: 'play_market' }
            case 'starsTransactionPeerPremiumBot':
                return { type: 'premium_bot' }
            case 'starsTransactionPeerFragment': {
                if (this.raw.gift) {
                    return { type: 'fragment' }
                }

                let status
                if (this.raw.pending) {
                    status = 'pending' as const
                } else if (this.raw.failed) {
                    status = 'failed' as const
                } else {
                    status = 'success' as const
                }

                return {
                    type: 'fragment_withdraw',
                    status,
                    date: this.raw.transactionDate
                        ? new Date(this.raw.transactionDate * 1000)
                        : undefined,
                    url: this.raw.transactionUrl,
                }
            }
            case 'starsTransactionPeerAds':
                return { type: 'ads' }
            case 'starsTransactionPeer': {
                const peer = parsePeer(this.raw.peer.peer, this.peers)

                if (this.raw.msgId) {
                    if (this.raw.reaction) {
                        return {
                            type: 'reaction',
                            peer,
                            messageId: this.raw.msgId,
                        }
                    }

                    return {
                        type: 'media_purchase',
                        peer,
                        messageId: this.raw.msgId,
                        media: this.raw.extendedMedia
                            ? this.raw.extendedMedia.map(it => _messageMediaFromTl(this.peers, it))
                            : undefined,
                    }
                }

                if (this.raw.subscriptionPeriod) {
                    return {
                        type: 'channel_subscription',
                        peer,
                        period: this.raw.subscriptionPeriod,
                    }
                }

                if (peer.type === 'user') {
                    if (this.raw.gift && !peer.isBot) {
                        return { type: 'gift', user: peer }
                    }

                    if (this.raw.title
                      || this.raw.description
                      || this.raw.photo
                      || this.raw.botPayload) {
                        return {
                            type: 'bot_purchase',
                            user: peer,
                            title: this.raw.title ?? '',
                            description: this.raw.description,
                            payload: this.raw.botPayload,
                            photo: this.raw.photo
                                ? new WebDocument(this.raw.photo)
                                : undefined,
                        }
                    }

                    return { type: 'unsupported' }
                }

                // todo
                return { type: 'unsupported' }
            }
            default:
                return { type: 'unsupported' }
        }
    }
}

makeInspectable(StarsTransaction)
memoizeGetters(StarsTransaction, ['amount', 'type'])
