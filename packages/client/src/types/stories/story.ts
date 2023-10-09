import { MtUnsupportedError, tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'
import { Photo, Video } from '../media'
import { _messageMediaFromTl, MessageEntity } from '../messages'
import { PeersIndex } from '../peers'
import { ReactionEmoji, toReactionEmoji } from '../reactions'
import { _storyInteractiveElementFromTl, StoryInteractiveElement } from './interactive'
import { StoryInteractions } from './story-interactions'

/**
 * Information about story visibility.
 *
 * - `public` - story is visible to everyone
 * - `contacts` - story is visible only to contacts
 * - `selectedContacts` - story is visible only to some contacts
 * - `closeFriends` - story is visible only to "close friends"
 */
export type StoryVisibility = 'public' | 'contacts' | 'selected_contacts' | 'close_friends'

export type StoryMedia = Photo | Video

export class Story {
    constructor(
        readonly raw: tl.RawStoryItem,
        readonly _peers: PeersIndex,
    ) {}

    /** Whether this story is pinned */
    get isPinned(): boolean {
        return this.raw.pinned!
    }

    /**
     * Whether this object contains reduced set of fields.
     *
     * When `true`, these field will not contain correct data:
     * {@link privacyRules}, {@link interactiveAreas}
     *
     */
    get isShort(): boolean {
        return this.raw.min!
    }

    /** Whether this story is content-protected, i.e. can't be forwarded */
    get isContentProtected(): boolean {
        return this.raw.noforwards!
    }

    /** Whether this story has been edited */
    get isEdited(): boolean {
        return this.raw.edited!
    }

    /** Whether this story has been posted by the current user */
    get isMy(): boolean {
        return this.raw.out!
    }

    /** ID of the story */
    get id(): number {
        return this.raw.id
    }

    /** Date when this story was posted */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /** Date when this story will expire */
    get expireDate(): Date {
        return new Date(this.raw.expireDate * 1000)
    }

    /** Whether the story is active (i.e. not expired yet) */
    get isActive(): boolean {
        return Date.now() < this.expireDate.getTime()
    }

    /** Story visibility */
    get visibility(): StoryVisibility {
        if (this.raw.public) return 'public'
        if (this.raw.contacts) return 'contacts'
        if (this.raw.closeFriends) return 'close_friends'
        if (this.raw.selectedContacts) return 'selected_contacts'

        throw new MtUnsupportedError('Unknown story visibility')
    }

    /** Caption of the story */
    get caption(): string | null {
        return this.raw.caption ?? null
    }

    private _entities?: MessageEntity[]
    /**
     * Caption entities (may be empty)
     */
    get entities(): ReadonlyArray<MessageEntity> {
        if (!this._entities) {
            this._entities = []

            if (this.raw.entities?.length) {
                for (const ent of this.raw.entities) {
                    this._entities.push(new MessageEntity(ent, this.raw.caption))
                }
            }
        }

        return this._entities
    }

    private _media?: StoryMedia
    /**
     * Story media.
     *
     * Currently, can only be {@link Photo} or {@link Video}.
     */
    get media(): StoryMedia {
        if (this._media === undefined) {
            const media = _messageMediaFromTl(this._peers, this.raw.media)

            switch (media?.type) {
                case 'photo':
                case 'video':
                    this._media = media
                    break
                default:
                    throw new MtUnsupportedError('Unsupported story media type')
            }
        }

        return this._media
    }

    private _interactiveElements?: StoryInteractiveElement[]
    /**
     * Interactive elements of the story
     */
    get interactiveElements() {
        if (!this.raw.mediaAreas) return []

        if (this._interactiveElements === undefined) {
            this._interactiveElements = this.raw.mediaAreas.map((it) => _storyInteractiveElementFromTl(it))
        }

        return this._interactiveElements
    }

    /**
     * Privacy rules of the story.
     *
     * Only available when {@link isMy} is `true`.
     */
    get privacyRules(): tl.TypePrivacyRule[] | null {
        if (!this.raw.privacy) return null

        return this.raw.privacy
    }

    private _interactions?: StoryInteractions
    /**
     * Information about story interactions
     */
    get interactions(): StoryInteractions | null {
        if (!this.raw.views) return null

        return (this._interactions ??= new StoryInteractions(this.raw.views, this._peers))
    }

    /**
     * Emoji representing a reaction sent by the current user, if any
     */
    get sentReactionEmoji(): ReactionEmoji | null {
        if (!this.raw.sentReaction) return null

        return toReactionEmoji(this.raw.sentReaction, true)
    }
}

makeInspectable(Story)
