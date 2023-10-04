import { TelegramClient } from '../../client'
import { InputPeerLike, InputReaction, normalizeInputReaction } from '../../types'

/**
 * Send (or remove) a reaction to a story
 *
 * @internal
 */
export async function sendStoryReaction(
    this: TelegramClient,
    peerId: InputPeerLike,
    storyId: number,
    reaction: InputReaction,
    params?: {
        /**
         * Whether to add this reaction to recently used
         */
        addToRecent?: boolean
    },
): Promise<void> {
    const { addToRecent } = params ?? {}

    const res = await this.call({
        _: 'stories.sendReaction',
        peer: await this.resolvePeer(peerId),
        storyId,
        reaction: normalizeInputReaction(reaction),
        addToRecent,
    })

    this._handleUpdate(res, true)
}
