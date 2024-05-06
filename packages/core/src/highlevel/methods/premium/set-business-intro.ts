import { tl } from '@mtcute/tl'

import { assertTrue, assertTypeIs } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputFileLike, InputMediaSticker } from '../../types/index.js'
import { _normalizeFileToDocument } from '../files/normalize-file-to-document.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'

const isInputMediaSticker = (media: unknown): media is InputMediaSticker =>
    typeof media === 'object' && media !== null && 'type' in media && media.type === 'sticker'

// @available=user
/**
 * Set current user's business introduction.
 *
 * @param intro  Introduction parameters, or `null` to remove
 */
export async function setBusinessIntro(
    client: ITelegramClient,
    intro: {
        /**
         * Title of the introduction
         */
        title?: string

        /**
         * Description of the introduction
         */
        description?: string

        /**
         * Sticker to show beneath the introduction
         */
        sticker?: InputMediaSticker | InputFileLike | tl.TypeInputDocument
    } | null,
): Promise<void> {
    let tlIntro: tl.TypeInputBusinessIntro | undefined = undefined

    if (intro) {
        let sticker: tl.TypeInputDocument | undefined

        if (intro.sticker) {
            if (isInputMediaSticker(intro.sticker)) {
                const media = await _normalizeInputMedia(client, intro.sticker, undefined, true)

                assertTypeIs('_normalizeInputMedia', media, 'inputMediaDocument')
                sticker = media.id
            } else {
                sticker = await _normalizeFileToDocument(client, intro.sticker, {})
            }
        }

        tlIntro = {
            _: 'inputBusinessIntro',
            title: intro.title ?? '',
            description: intro.description ?? '',
            sticker,
        }
    }

    const res = await client.call({
        _: 'account.updateBusinessIntro',
        intro: tlIntro,
    })

    assertTrue('account.updateBusinessIntro', res)
}
