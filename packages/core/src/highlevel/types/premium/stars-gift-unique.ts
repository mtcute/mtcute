import type { tl } from '@mtcute/tl'
import type { Sticker } from '../media/sticker.js'
import type { TextWithEntities } from '../misc/entities.js'
import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'
import { assert } from '@fuman/utils'
import { getMarkedPeerId } from '../../../utils/peer-utils.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parseDocument } from '../media/document-utils.js'
import { parsePeer } from '../peers/peer.js'

/** An attribute of a unique star gift containing a sticker */
export class StarGiftUniqueAttribute {
    constructor(
        readonly raw: tl.RawStarGiftAttributeModel | tl.RawStarGiftAttributePattern,
    ) {}

    /** Rarity permille of the attribute */
    get permille(): number {
        return this.raw.rarityPermille
    }

    /** Display name of the attribute */
    get name(): string {
        return this.raw.name
    }

    get sticker(): Sticker {
        assert(this.raw.document._ === 'document')
        const parsed = parseDocument(this.raw.document)
        assert(parsed.type === 'sticker')

        return parsed
    }
}

makeInspectable(StarGiftUniqueAttribute)
memoizeGetters(StarGiftUniqueAttribute, ['sticker'])

/** Information about a unique star gift's backdrop */
export class StarGiftUniqueBackdrop {
    constructor(
        readonly raw: tl.RawStarGiftAttributeBackdrop,
    ) {}

    /** ID of the backdrop */
    get id(): number {
        return this.raw.backdropId
    }

    /** Rarity permille of the attribute */
    get permille(): number {
        return this.raw.rarityPermille
    }

    /** Display name of the attribute */
    get name(): string {
        return this.raw.name
    }

    get centerColor(): number {
        return this.raw.centerColor
    }

    get edgeColor(): number {
        return this.raw.edgeColor
    }

    get patternColor(): number {
        return this.raw.patternColor
    }

    get textColor(): number {
        return this.raw.textColor
    }
}
makeInspectable(StarGiftUniqueBackdrop)

/** Details about the original star gift */
export class StarGiftUniqueOriginalDetails {
    constructor(
        readonly raw: tl.RawStarGiftAttributeOriginalDetails,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Peer who sent the original star gift, if available
     *
     * > Note: in some cases, {@link senderId} might be available, but not this field.
     * > In such cases, you should try fetching the peer manually using {@link getPeer})
     */
    get sender(): Peer | null {
        if (!this.raw.senderId) return null
        if (!this._peers.has(this.raw.senderId)) return null
        return parsePeer(this.raw.senderId, this._peers)
    }

    /** ID of the peer who sent the original star gift */
    get senderId(): number | null {
        return this.raw.senderId ? getMarkedPeerId(this.raw.senderId) : null
    }

    /**
     * Peer who received the original star gift, if available
     *
     * > Note: {@link recipientId} is always available. If ID is available, but this field is null,
     * > you should try fetching the peer manually using {@link getPeer})
     */
    get recipient(): Peer | null {
        if (!this._peers.has(this.raw.recipientId)) return null
        return parsePeer(this.raw.recipientId, this._peers)
    }

    /** ID of the peer who received the original star gift */
    get recipientId(): number {
        return getMarkedPeerId(this.raw.recipientId)
    }

    /** Date when the original star gift was sent */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /** Message attached to the original star gift */
    get message(): TextWithEntities | null {
        return this.raw.message ?? null
    }
}

makeInspectable(StarGiftUniqueOriginalDetails)

/** A unique star gift */
export class StarGiftUnique {
    readonly _model!: tl.RawStarGiftAttributeModel
    readonly _pattern!: tl.RawStarGiftAttributePattern
    readonly _backdrop!: tl.RawStarGiftAttributeBackdrop
    readonly _originalDetails: tl.RawStarGiftAttributeOriginalDetails | undefined

    /** Whether this gift is a unique gift */
    readonly isUnique = true as const

    constructor(
        readonly raw: tl.RawStarGiftUnique,
        readonly _peers: PeersIndex,
    ) {
        for (const attr of this.raw.attributes) {
            if (attr._ === 'starGiftAttributeModel') {
                this._model = attr
            } else if (attr._ === 'starGiftAttributePattern') {
                this._pattern = attr
            } else if (attr._ === 'starGiftAttributeBackdrop') {
                this._backdrop = attr
            } else if (attr._ === 'starGiftAttributeOriginalDetails') {
                this._originalDetails = attr
            }
        }

        assert(this._model !== undefined)
        assert(this._pattern !== undefined)
        assert(this._backdrop !== undefined)
    }

    /** Whether this gift is available only to premium users */
    get isPremiumOnly(): boolean {
        return this.raw.requirePremium!
    }

    /** Number of the NFT */
    get num(): number {
        return this.raw.num
    }

    /** Title of the NFT */
    get title(): string {
        return this.raw.title
    }

    /** Slug of the gift */
    get slug(): string {
        return this.raw.slug
    }

    /**
     * ID of the peer who owns this gift, if available
     * > Note: in some cases, only {@link ownerId} is available, and not {@link owner},
     * > in which cases please use `tg.getPeer(ownerId)` manually
     */
    get owner(): Peer | null {
        if (!this.raw.ownerId) return null
        if (!this._peers.has(this.raw.ownerId)) return null
        return parsePeer(this.raw.ownerId, this._peers)
    }

    /** ID of the peer who owns this gift, if available */
    get ownerId(): number | null {
        return this.raw.ownerId ? getMarkedPeerId(this.raw.ownerId) : null
    }

    /** Name of the user who owns this gift, if available */
    get ownerName(): string | null {
        return this.raw.ownerName ?? null
    }

    // todo: merge into one property
    get availabilityIssued(): number {
        return this.raw.availabilityIssued
    }

    get availabilityTotal(): number {
        return this.raw.availabilityTotal
    }

    /** Number of stars this gift is up for resell for */
    get resellPrice(): tl.Long | null {
        return this.raw.resellStars ?? null
    }

    /** Model (i.e. the gift itself) of the unique star gift */
    get model(): StarGiftUniqueAttribute {
        return new StarGiftUniqueAttribute(this._model)
    }

    /** Pattern of the unique star gift */
    get pattern(): StarGiftUniqueAttribute {
        return new StarGiftUniqueAttribute(this._pattern)
    }

    /** Backdrop of the unique star gift */
    get backdrop(): StarGiftUniqueBackdrop {
        return new StarGiftUniqueBackdrop(this._backdrop)
    }

    /** Details about the original star gift (if they were retained when minting) */
    get originalDetails(): StarGiftUniqueOriginalDetails | null {
        if (!this._originalDetails) return null
        return new StarGiftUniqueOriginalDetails(this._originalDetails, this._peers)
    }

    /** TON address of the owner of the unique star gift */
    get ownerAddress(): string | null {
        return this.raw.ownerAddress ?? null
    }

    /** TON address of the gift NFT */
    get giftAddress(): string | null {
        return this.raw.giftAddress ?? null
    }

    /**
     * User/channel who released this collection
     */
    get releasedBy(): Peer | null {
        if (!this.raw.releasedBy) return null
        return parsePeer(this.raw.releasedBy, this._peers)
    }
}

makeInspectable(StarGiftUnique)
memoizeGetters(StarGiftUnique, ['model', 'pattern', 'backdrop', 'originalDetails'])
