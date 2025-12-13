import type { tl } from '@mtcute/tl'

import type { MessageMedia } from '../messages/message-media.js'
import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'
import type { User } from '../peers/user.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { WebDocument } from '../files/web-document.js'
import { _messageMediaFromTl } from '../messages/message-media.js'
import { parsePeer } from '../peers/peer.js'

import { StarGiftUnique } from './star-gift-unique.js'
import { StarGift } from './star-gift.js'

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
 *  - `star_gift`: This transaction is either a star gift to a user (if outgoing), or converting a star gift to stars (if incoming)
 *  - `star_gift_upgrade`: This transaction is for a star gift upgrade
 *  - `star_gift_transfer`: This transaction is for a star gift transfer
 *  - `star_gift_resale`: This transaction is for a star gift resale
 *  - `paid_message`: This transaction is a payment for a paid message
 *  - `premium_gift`: This transaction is a payment for a premium gift to a user
 *  - `api_*`: This transaction is a payment for paid API features
 *     - `api_floodskip`: This transaction is a payment for a paid bot broadcast
 *  - `bot_referral`: This transaction is proceeds from a bot referral program
 *  - `ads_proceeds`: This transaction is proceeds from Telegram Ads
 *  - `paid_search`: This transaction is a payment for a paid search
 *  - `star_gift_prepaid_upgrade`: This transaction is for a star gift prepaid upgrade
 *  - `star_gift_drop_details`: This transaction is for dropping the original details of a star gift
 */
export type StarsTransactionType
  = | { type: 'unsupported' }
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
    | {
      type: 'giveaway'
      /** Related peer */
      peer: Peer
      /** ID of the message containing the giveaway where the stars were given */
      messageId: number
    }
    | {
      type: 'star_gift'
      /** Related peer */
      peer: Peer
      /** The gift */
      gift: StarGift
    }
    | {
      type: 'star_gift_upgrade'
      /** Related peer */
      peer: Peer
      /** The upgraded gift */
      gift: StarGiftUnique
    }
    | {
      type: 'star_gift_resale'
      /** Related peer */
      peer: Peer
      /** The resold gift */
      gift: StarGiftUnique
    }
    | {
      type: 'star_gift_transfer'
      /** Recipient peer */
      recipient: Peer
      /** The upgraded gift */
      gift: StarGiftUnique
    }
    | {
      type: 'star_gift_offer'
      /** Related peer */
      peer: Peer
      /** The gift that was offered for sale */
      gift: StarGiftUnique
    }
    | {
      type: 'paid_message'
      /** Related peer */
      peer: Peer
      /** The number of messages paid for */
      count: number
    }
    | {
      type: 'premium_gift'
      /** Related peer */
      peer: Peer
      /** Number of months paid for */
      months: number
    }
    | {
      type: 'api_floodskip'
      /** The number of billed API calls */
      count: number
    }
    | {
      type: 'bot_referral'
      /** Related bot */
      peer: Peer
      /** Commission in permille */
      commission: number
    }
    | {
      type: 'ads_proceeds'
      /** Related peer */
      peer: Peer
      /** Start of the period */
      fromDate: Date
      /** End of the period */
      toDate: Date
    }
    | { type: 'paid_search' }
    | {
      type: 'star_gift_prepaid_upgrade'
      /** Related peer */
      peer: Peer
      /** The upgraded gift */
      gift: StarGiftUnique
    }
    | {
      type: 'star_gift_drop_details'
      /** Related peer */
      peer: Peer
      /** The dropped gift */
      gift: StarGiftUnique
    }
    // todo: phonegroup_message, stargift_auction_bid

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
    let isNegative = this.raw.amount.amount.isNegative()
    if (this.raw.refund) isNegative = !isNegative

    return isNegative ? 'outgoing' : 'incoming'
  }

  /** Absolute amount of stars/TON in the transaction */
  get amount(): tl.TypeStarsAmount {
    let res = this.raw.amount

    if (res.amount.isNegative()) {
      res = res._ === 'starsAmount'
        ? {
            ...res,
            nanos: Math.abs(res.nanos),
            amount: res.amount.negate(),
          }
        : {
            _: 'starsTonAmount',
            amount: res.amount.negate(),
          }
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
      case 'starsTransactionPeerAPI':
        if (this.raw.floodskipNumber != null) {
          return {
            type: 'api_floodskip',
            count: this.raw.floodskipNumber,
          }
        }

        return { type: 'unsupported' }
      case 'starsTransactionPeer': {
        const peer = parsePeer(this.raw.peer.peer, this.peers)

        if (this.raw.postsSearch) {
          return { type: 'paid_search' }
        }

        if (this.raw.giveawayPostId) {
          return {
            type: 'giveaway',
            peer,
            messageId: this.raw.giveawayPostId,
          }
        }

        if (this.raw.paidMessages) {
          return {
            type: 'paid_message',
            peer,
            count: this.raw.paidMessages,
          }
        }

        if (this.raw.premiumGiftMonths) {
          return {
            type: 'premium_gift',
            peer,
            months: this.raw.premiumGiftMonths,
          }
        }

        if (this.raw.stargift) {
          if (this.raw.stargift._ === 'starGift') {
            return {
              type: 'star_gift',
              peer,
              gift: new StarGift(this.raw.stargift, this.peers),
            }
          } else if (this.raw.stargiftUpgrade) {
            return {
              type: 'star_gift_upgrade',
              peer,
              gift: new StarGiftUnique(this.raw.stargift, this.peers),
            }
          } else if (this.raw.stargiftResale) {
            return {
              type: 'star_gift_resale',
              peer,
              gift: new StarGiftUnique(this.raw.stargift, this.peers),
            }
          } else if (this.raw.stargiftPrepaidUpgrade) {
            return {
              peer,
              gift: new StarGiftUnique(this.raw.stargift, this.peers),
              type: 'star_gift_prepaid_upgrade',
            }
          } else if (this.raw.stargiftDropOriginalDetails) {
            return {
              type: 'star_gift_drop_details',
              peer,
              gift: new StarGiftUnique(this.raw.stargift, this.peers),
            }
          } else if (this.raw.offer) {
            return {
              type: 'star_gift_offer',
              peer,
              gift: new StarGiftUnique(this.raw.stargift, this.peers),
            }
          } else {
            return {
              type: 'star_gift_transfer',
              recipient: peer,
              gift: new StarGiftUnique(this.raw.stargift, this.peers),
            }
          }
        }

        if (this.raw.stargiftUpgrade) {
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
        }

        if (this.raw.subscriptionPeriod) {
          return {
            type: 'channel_subscription',
            peer,
            period: this.raw.subscriptionPeriod,
          }
        }

        if (this.raw.starrefCommissionPermille) {
          return {
            type: 'bot_referral',
            peer,
            commission: this.raw.starrefCommissionPermille,
          }
        }

        if (this.raw.adsProceedsFromDate && this.raw.adsProceedsToDate) {
          return {
            type: 'ads_proceeds',
            peer,
            fromDate: new Date(this.raw.adsProceedsFromDate * 1000),
            toDate: new Date(this.raw.adsProceedsToDate * 1000),
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

  /** Whether this transaction was made by a business bot */
  get viaBusinessBot(): boolean {
    return this.raw.businessTransfer!
  }
}

makeInspectable(StarsTransaction)
memoizeGetters(StarsTransaction, ['amount', 'type'])
