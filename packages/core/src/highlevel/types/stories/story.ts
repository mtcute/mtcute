import { tl } from '@mtcute/tl'

import { MtUnsupportedError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parseDocument } from '../media/document-utils.js'
import { Photo } from '../media/photo.js'
import { Video } from '../media/video.js'
import { MessageEntity } from '../messages/message-entity.js'
import { PeersIndex } from '../peers/index.js'
import { ReactionEmoji, toReactionEmoji } from '../reactions/index.js'
import { _storyInteractiveElementFromTl, StoryInteractiveElement } from './interactive/index.js'
import { StoryInteractions } from './story-interactions.js'

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

    /**
     * Caption entities (may be empty)
     */
    get entities(): ReadonlyArray<MessageEntity> {
        const entities = []

        if (this.raw.entities?.length) {
            for (const ent of this.raw.entities) {
                entities.push(new MessageEntity(ent, this.raw.caption))
            }
        }

        return entities
    }

    /**
     * Story media.
     *
     * Currently, can only be {@link Photo} or {@link Video}.
     */
    get media(): StoryMedia {
        switch (this.raw.media._) {
            case 'messageMediaPhoto':
                if (this.raw.media.photo?._ !== 'photo') throw new MtUnsupportedError('Unsupported story media type')

                return new Photo(this.raw.media.photo, this.raw.media)
            case 'messageMediaDocument': {
                if (this.raw.media.document?._ !== 'document') {
                    throw new MtUnsupportedError('Unsupported story media type')
                }

                const doc = parseDocument(this.raw.media.document, this.raw.media)
                if (doc.type === 'video') return doc
            }
        }

        throw new MtUnsupportedError('Unsupported story media type')
    }

    /**
     * Interactive elements of the story
     */
    get interactiveElements(): StoryInteractiveElement[] {
        if (!this.raw.mediaAreas) return []

        return this.raw.mediaAreas.map((it) => _storyInteractiveElementFromTl(it, this._peers))
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

    /**
     * Information about story interactions
     */
    get interactions(): StoryInteractions | null {
        if (!this.raw.views) return null

        return new StoryInteractions(this.raw.views, this._peers)
    }

    /**
     * Emoji representing a reaction sent by the current user, if any
     */
    get sentReactionEmoji(): ReactionEmoji | null {
        if (!this.raw.sentReaction) return null

        return toReactionEmoji(this.raw.sentReaction, true)
    }
}

memoizeGetters(Story, ['entities', 'media', 'interactiveElements', 'interactions'])
makeInspectable(Story)
