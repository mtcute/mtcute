import { tl } from '@mtcute/tl'

import { randomLong } from '../../../utils/long-utils.js'
import { ITelegramClient } from '../../client.types.js'
import { InputMediaLike, InputPeerLike, InputPrivacyRule, InputText, Story } from '../../types/index.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'
import { _normalizePrivacyRules } from '../misc/normalize-privacy-rules.js'
import { _normalizeInputText } from '../misc/normalize-text.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _findStoryInUpdate } from './find-in-update.js'

/**
 * Send a story
 *
 * @returns  Created story
 */
export async function sendStory(
    client: ITelegramClient,
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
        caption?: InputText

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

    const inputMedia = await _normalizeInputMedia(client, media)
    const privacyRules = params.privacyRules ?
        await _normalizePrivacyRules(client, params.privacyRules) :
        [{ _: 'inputPrivacyValueAllowAll' } as const]

    const [caption, entities] = await _normalizeInputText(
        client,
        // some types dont have `caption` field, and ts warns us,
        // but since it's JS, they'll just be `undefined` and properly handled by the method
        params.caption || (media as Extract<typeof media, { caption?: unknown }>).caption,
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
