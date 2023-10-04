import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { FormattedString, InputMediaLike, InputPeerLike, InputPrivacyRule, Story } from '../../types'

/**
 * Edit a sent story
 *
 * @returns  Edited story
 * @internal
 */
export async function editStory(
    this: TelegramClient,
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
        media = await this._normalizeInputMedia(params.media, params)

        // if there's no caption in input media (i.e. not present or undefined),
        // user wants to keep current caption, thus `content` needs to stay `undefined`
        if ('caption' in params.media && params.media.caption !== undefined) {
            [caption, entities] = await this._parseEntities(
                params.media.caption,
                params.parseMode,
                params.media.entities,
            )
        }
    }

    if (params.caption) {
        [caption, entities] = await this._parseEntities(params.caption, params.parseMode, params.entities)
    }

    const privacyRules = params.privacyRules ? await this._normalizePrivacyRules(params.privacyRules) : undefined

    const res = await this.call({
        _: 'stories.editStory',
        peer: await this.resolvePeer(peer),
        id,
        media,
        mediaAreas: interactiveElements,
        caption,
        entities,
        privacyRules,
    })

    return this._findStoryInUpdate(res)
}
