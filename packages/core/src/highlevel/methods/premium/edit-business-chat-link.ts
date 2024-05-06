import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputText } from '../../types/index.js'
import { BusinessChatLink } from '../../types/premium/business-chat-link.js'
import { _normalizeInputText } from '../misc/normalize-text.js'

// @available=user
/**
 * Edit an existing business chat link
 *
 * @param link  The link to edit
 */
export async function editBusinessChatLink(
    client: ITelegramClient,
    link: string | BusinessChatLink,
    params: {
        /** Text to be inserted in the message input */
        text: InputText
        /** Custom title for the link */
        title?: string
    },
): Promise<BusinessChatLink> {
    const [message, entities] = await _normalizeInputText(client, params.text)
    const res = await client.call({
        _: 'account.editBusinessChatLink',
        slug: link instanceof BusinessChatLink ? link.link : link,
        link: {
            _: 'inputBusinessChatLink',
            message,
            entities,
            title: params?.title,
        },
    })

    return new BusinessChatLink(res)
}

// @available=user
/**
 * Delete a business chat link
 *
 * @param link  The link to delete
 */
export async function deleteBusinessChatLink(client: ITelegramClient, link: string | BusinessChatLink): Promise<void> {
    const res = await client.call({
        _: 'account.deleteBusinessChatLink',
        slug: typeof link === 'string' ? link : link.link,
    })

    assertTrue('account.deleteBusinessChatLink', res)
}
