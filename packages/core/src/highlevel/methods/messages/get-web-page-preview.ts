import type { ITelegramClient } from '../../client.types.js'
import type { InputText } from '../../types/misc/entities.js'
import { assert } from '@fuman/utils'
import { WebPageMedia } from '../../types/media/web-page.js'
import { _normalizeInputText } from '../misc/normalize-text.js'

/**
 * Get a preview of a web page contained in the message
 *
 * @param text  Text of the message, or simply the link for which the preview should be retrieved
 */
export async function getWebPagePreview(
    client: ITelegramClient,
    text: InputText,
): Promise<WebPageMedia | null> {
    const [message, entities] = await _normalizeInputText(client, text)

    const res = await client.call({
        _: 'messages.getWebPagePreview',
        message,
        entities,
    })

    if (res.media._ === 'messageMediaEmpty') return null
    assert(res.media._ === 'messageMediaWebPage')

    return new WebPageMedia(res.media)
}
