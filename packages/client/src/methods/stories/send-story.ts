import { BaseTelegramClient, tl } from '@mtcute/core'
import { randomLong } from '@mtcute/core/utils'

import { FormattedString, InputMediaLike, InputPeerLike, InputPrivacyRule, Story } from '../../types'
import { _normalizeInputMedia } from '../files/normalize-input-media'
import { _parseEntities } from '../messages/parse-entities'
import { _normalizePrivacyRules } from '../misc/normalize-privacy-rules'
import { resolvePeer } from '../users/resolve-peer'
import { _findStoryInUpdate } from './find-in-update'

/**
 * Send a story
 *
 * @returns  Created story
 */
export async function sendStory(
    client: BaseTelegramClient,
    params: {
        /**
         * Peer ID to send story as
         *
         * @default  `self`
         */
        peer?: InputPeerLike

        /**
         * Media contained in a story. Currently can only be a photo or a video.
         *
         * You can also pass TDLib and Bot API compatible File ID,
         * which will be wrapped in {@link InputMedia.auto}
         */
        media: InputMediaLike | string

        /**
         * Override caption for {@link media}
         */
        caption?: string | FormattedString<string>

        /**
         * Override entities for {@link media}
         */
        entities?: tl.TypeMessageEntity[]

        /**
         * Parse mode to use to parse entities before sending
         * the message. Defaults to current default parse mode (if any).
         *
         * Passing `null` will explicitly disable formatting.
         */
        parseMode?: string | null

        /**
         * Whether to automatically pin this story to the profile
         */
        pinned?: boolean

        /**
         * Whether to disallow sharing this story
         */
        forbidForwards?: boolean

        /**
         * Interactive elements to add to the story
         */
        interactiveElements?: tl.TypeMediaArea[]

        /**
         * Privacy rules to apply to the story
         *
         * @default  "Everyone"
         */
        privacyRules?: InputPrivacyRule[]

        /**
         * TTL period of the story, in seconds
         *
         * @default  86400
         */
        period?: number
    },
): Promise<Story> {
    const { peer = 'me', pinned, forbidForwards, interactiveElements, period } = params
    let { media } = params

    if (typeof media === 'string') {
        media = {
            type: 'auto',
            file: media,
        }
    }

    const inputMedia = await _normalizeInputMedia(client, media, params)
    const privacyRules = params.privacyRules ?
        await _normalizePrivacyRules(client, params.privacyRules) :
        [{ _: 'inputPrivacyValueAllowAll' } as const]

    const [caption, entities] = await _parseEntities(
        client,
        // some types dont have `caption` field, and ts warns us,
        // but since it's JS, they'll just be `undefined` and properly
        // handled by _parseEntities method
        params.caption || (media as Extract<typeof media, { caption?: unknown }>).caption,
        params.parseMode,
        params.entities || (media as Extract<typeof media, { entities?: unknown }>).entities,
    )

    const res = await client.call({
        _: 'stories.sendStory',
        pinned,
        noforwards: forbidForwards,
        peer: await resolvePeer(client, peer),
        media: inputMedia,
        mediaAreas: interactiveElements,
        caption,
        entities,
        privacyRules,
        randomId: randomLong(),
        period,
    })

    return _findStoryInUpdate(client, res)
}
