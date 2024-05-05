import { ITelegramClient } from '../../client.types.js'
import { InputText } from '../../types/index.js'
import { BusinessChatLink } from '../../types/premium/business-chat-link.js'
import { _normalizeInputText } from '../misc/normalize-text.js'

// @available=user
/**
 * Create a new business chat link
 *
 * @param text  Text to be inserted into the message input
 */
export async function createBusinessChatLink(
    client: ITelegramClient,
    text: InputText,
    params?: {
        /** Custom title for the link */
        title?: string
    },
): Promise<BusinessChatLink> {
    const [message, entities] = await _normalizeInputText(client, text)
    const res = await client.call({
        _: 'account.createBusinessChatLink',
        link: {
            _: 'inputBusinessChatLink',
            message,
            entities,
            title: params?.title,
        },
    })

    return new BusinessChatLink(res)
}
