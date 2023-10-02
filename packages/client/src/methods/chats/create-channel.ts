import { TelegramClient } from '../../client'
import { Chat } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Create a new broadcast channel
 *
 * @returns  Newly created channel
 * @internal
 */
export async function createChannel(
    this: TelegramClient,
    params: {
        /**
         * Channel title
         */
        title: string

        /**
         * Channel description
         */
        description?: string
    },
): Promise<Chat> {
    const { title, description = '' } = params

    const res = await this.call({
        _: 'channels.createChannel',
        title,
        about: description,
        broadcast: true,
    })

    assertIsUpdatesGroup('channels.createChannel', res)

    this._handleUpdate(res)

    return new Chat(this, res.chats[0])
}
