import { TelegramClient } from '../../client'
import { Chat } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Create a new supergroup
 *
 * @param title  Title of the supergroup
 * @param description  Description of the supergroup
 * @internal
 */
export async function createSupergroup(
    this: TelegramClient,
    title: string,
    description = ''
): Promise<Chat> {
    const res = await this.call({
        _: 'channels.createChannel',
        title,
        about: description,
        megagroup: true,
    })

    assertIsUpdatesGroup('channels.createChannel', res)

    this._handleUpdate(res)

    return new Chat(this, res.chats[0])
}
