import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'
import { PeersIndex, User } from '../peers'

export class PreCheckoutQuery {
    constructor(
        public readonly client: TelegramClient,
        public readonly raw: tl.RawUpdateBotPrecheckoutQuery,
        public readonly _peers: PeersIndex
    ) {}

    /**
     * ID of the query
     */
    get queryId(): tl.Long {
        return this.raw.queryId
    }

    /**
     * ID of the user who sent the query
     */
    get userId(): number {
        return this.raw.userId
    }

    private _user?: User
    /**
     * User who sent the query
     */
    get user(): User {
        if (!this._user) {
            this._user = new User(this.client, this._peers.user(this.userId))
        }

        return this._user
    }

    /**
     * Bot-defined payload of the original invoice
     * (see {@link InputMediaInvoice.payload})
     */
    get payload(): Buffer {
        return this.raw.payload
    }

    /**
     * User-provided payment info (like name, phone, shipping address, etc.)
     */
    get paymentInfo(): tl.RawPaymentRequestedInfo | null {
        if (!this.raw.info) return null
        return this.raw.info
    }

    /**
     * Currency of the payment
     */
    get currency(): string {
        return this.raw.currency
    }

    /**
     * Total price of the payment
     */
    get totalAmount(): tl.Long {
        return this.raw.totalAmount
    }

    /**
     * Approve the query
     */
    approve(): Promise<void> {
        return this.client.answerPreCheckoutQuery(this.queryId)
    }

    /**
     * Reject the query
     */
    reject(error = ''): Promise<void> {
        return this.client.answerPreCheckoutQuery(this.queryId, error)
    }
}

makeInspectable(PreCheckoutQuery)
