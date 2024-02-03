import Long from 'long'

import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'

/**
 * Input version of {@link ReactionEmoji}, which also accepts bare TL object
 */
export type InputReaction = string | tl.Long | tl.TypeReaction

/**
 * Emoji describing a reaction.
 *
 * Either a `string` with a unicode emoji, or a `tl.Long` for a custom emoji
 */
export type ReactionEmoji = string | tl.Long

export function normalizeInputReaction(reaction?: InputReaction | null): tl.TypeReaction {
    if (typeof reaction === 'string') {
        return {
            _: 'reactionEmoji',
            emoticon: reaction,
        }
    } else if (Long.isLong(reaction)) {
        return {
            _: 'reactionCustomEmoji',
            documentId: reaction,
        }
    } else if (reaction) {
        return reaction
    }

    return {
        _: 'reactionEmpty',
    }
}

export function toReactionEmoji(reaction: tl.TypeReaction, allowEmpty?: false): ReactionEmoji
export function toReactionEmoji(reaction: tl.TypeReaction, allowEmpty: true): ReactionEmoji | null

export function toReactionEmoji(reaction: tl.TypeReaction, allowEmpty?: boolean): ReactionEmoji | null {
    switch (reaction._) {
        case 'reactionEmoji':
            return reaction.emoticon
        case 'reactionCustomEmoji':
            return reaction.documentId
        case 'reactionEmpty':
            if (!allowEmpty) {
                throw new MtTypeAssertionError('toReactionEmoji', 'not reactionEmpty', reaction._)
            }

            return null
    }
}
