import { ITelegramClient } from '../../client.types.js'
import { BusinessChatLink } from '../../types/premium/business-chat-link.js'

// @available=user
/**
 * Get current user's business chat links
 */
export async function getBusinessChatLinks(client: ITelegramClient): Promise<BusinessChatLink[]> {
    const res = await client.call({ _: 'account.getBusinessChatLinks' })

    return res.links.map((x) => new BusinessChatLink(x))
}
