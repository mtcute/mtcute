import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'

/**
 * Change user status to offline or online
 *
 * @param offline  Whether the user is currently offline
 */
export async function setOffline(client: ITelegramClient, offline = true): Promise<void> {
    const r = await client.call({
        _: 'account.updateStatus',
        offline,
    })

    assertTrue('account.updateStatus', r)
}
