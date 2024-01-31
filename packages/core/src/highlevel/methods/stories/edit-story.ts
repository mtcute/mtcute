import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputMediaLike, InputPeerLike, InputPrivacyRule, InputText, Story } from '../../types/index.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'
import { _normalizePrivacyRules } from '../misc/normalize-privacy-rules.js'
import { _normalizeInputText } from '../misc/normalize-text.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _findStoryInUpdate } from './find-in-update.js'

/**
 * Edit a sent story
 *
 * @returns  Edited story
 */
export async function editStory(
    client: ITelegramClient,
    params: {
        /**
         * Story ID to edit
         */
        id: number

        /**
         * Peer ID to whose story to edit
         *
         * @default  `self`
         */
        peer?: InputPeerLike

        /**
         * Media contained in a story. Currently can only be a photo or a video.
         */
        media?: InputMediaLike

        /**
         * Override caption for {@link media}
         */
        caption?: InputText

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
    },
): Promise<Story> {
    const { id, peer = 'me', interactiveElements } = params

    let caption: string | undefined = undefined
    let entities: tl.TypeMessageEntity[] | undefined
    let media: tl.TypeInputMedia | undefined = undefined

    if (params.media) {
        media = await _normalizeInputMedia(client, params.media)

        // if there's no caption in input media (i.e. not present or undefined),
        // user wants to keep current caption, thus `content` needs to stay `undefined`
        if ('caption' in params.media && params.media.caption !== undefined) {
            [caption, entities] = await _normalizeInputText(client, params.media.caption)
        }
    }

    if (params.caption) {
        [caption, entities] = await _normalizeInputText(client, params.caption)
    }

    const privacyRules = params.privacyRules ? await _normalizePrivacyRules(client, params.privacyRules) : undefined

    const res = await client.call({
        _: 'stories.editStory',
        peer: await resolvePeer(client, peer),
        id,
        media,
        mediaAreas: interactiveElements,
        caption,
        entities,
        privacyRules,
    })

    return _findStoryInUpdate(client, res)
}
