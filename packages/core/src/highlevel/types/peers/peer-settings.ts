import type { tl } from '@mtcute/tl'
import type { PeersIndex } from './peers-index.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { User } from './user.js'

/**
 * Action bar that should be displayed in the chat with the user,
 * containing the suggested actions to do with the user.
 */
export type ChatActionBar =
  | {
      /** The user is an administrator of a chat to which we sent a join request */
      type: 'join_request'
      /** Title of the chat */
      chatTitle: string
      /** Whether the chat is a broadcast channel */
      isBroadcast: boolean
      /** Date when the join request was sent */
      requestDate: Date
  }
  | {
      /** The chat is a recently created group chat to which new members are suggested to be invited */
      type: 'invite_members'
  }
  | {
      /**
       * The chat is with a user, and adding them to contacts is suggested
       * (normally this happens when they added us to their contacts)
       */
      type: 'add_contact'
      /** Whether we will need to explicitly share phone number with the user when adding them to contacts */
      needPhoneNumberPrivacyException: boolean
  }
  | {
      /**
       * The chat is with a user, and sharing a phone number with them is suggested
       * (normally this happens when they shared their phone number with us)
       */
      type: 'share_phone_number'
  }
  | {
      /** This chat is with a new user who is not in our contacts, and either adding them to contacts or block+report-ing them is suggested */
      type: 'add_or_report'

      /** Whether we can report this user for spamming */
      canReportSpam?: boolean

      /** Whether this chat was automatically archived and we can unarchive it */
      canUnarchive: boolean
  }
  | {
      /** This chat is managed with a business bot */
      type: 'business_bot'

      /** The business bot that manages this chat */
      bot: User
      /** Deep link to the bot's management menu */
      manageUrl: string
  }

export class PeerSettings {
    constructor(
        readonly raw: tl.RawPeerSettings,
        readonly _peers?: PeersIndex | undefined,
    ) {}

    /** Action bar that should be displayed in the chat with the user */
    get actionBar(): ChatActionBar | null {
        if (this.raw.requestChatTitle) {
            return {
                type: 'join_request',
                chatTitle: this.raw.requestChatTitle,
                isBroadcast: this.raw.requestChatBroadcast!,
                requestDate: new Date(this.raw.requestChatDate ?? 0),
            }
        }

        if (this.raw.reportGeo) {
            // geo chats are deprecated
            return null
        }

        if (this.raw.inviteMembers) {
            return { type: 'invite_members' }
        }

        if (this.raw.shareContact) {
            return { type: 'share_phone_number' }
        }

        if (this.raw.blockContact || this.raw.reportSpam) {
            return {
                type: 'add_or_report',
                canReportSpam: this.raw.reportSpam!,
                canUnarchive: this.raw.autoarchived!,
            }
        }

        if (this.raw.addContact) {
            return {
                type: 'add_contact',
                needPhoneNumberPrivacyException: this.raw.needContactsException!,
            }
        }

        if (this.raw.businessBotId && this._peers) {
            return {
                type: 'business_bot',
                bot: new User(this._peers.user(this.raw.businessBotId)),
                manageUrl: this.raw.businessBotManageUrl ?? '',
            }
        }

        return null
    }

    /** Distance in meters between us and the user */
    get geoDistance(): number | null {
        return this.raw.geoDistance ?? null
    }

    /**
     * Price of paid messages to this peer for the current user
     * (note that this might differ from {@link User.paidMessagePrice},
     * because the user might have added us to their contacts or wrote first,
     * in which case the messages are free regardless)
     */
    get paidMessagePrice(): tl.Long | null {
        return this.raw.chargePaidMessageStars ?? null
    }

    /**
     * Month and year when the user registered.
     * Only available for users who contacted us first.
     */
    get registrationDate(): string | null {
        return this.raw.registrationMonth ?? null
    }

    /**
     * ISO country code of the user's phone number.
     * Only available for users who contacted us first.
     */
    get phoneCountry(): string | null {
        return this.raw.phoneCountry ?? null
    }

    /**
     * Date when the user has last changed their name.
     * Only available for users who contacted us first.
     */
    get nameChangeDate(): Date | null {
        return this.raw.nameChangeDate ? new Date(this.raw.nameChangeDate * 1000) : null
    }

    /**
     * Date when the user has last changed their photo.
     * Only available for users who contacted us first.
     */
    get photoChangeDate(): Date | null {
        return this.raw.photoChangeDate ? new Date(this.raw.photoChangeDate * 1000) : null
    }
}

makeInspectable(PeerSettings)
memoizeGetters(PeerSettings, ['actionBar'])
