import { BaseTelegramClient } from '@mtcute/core'

import { Chat } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../utils/updates-utils.js'

/**
 * Create a new broadcast channel
 *
 * @returns  Newly created channel
 */
export async function createChannel(
    client: BaseTelegramClient,
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

    const res = await client.call({
        _: 'channels.createChannel',
        title,
        about: description,
        broadcast: true,
    })

    assertIsUpdatesGroup('channels.createChannel', res)

    client.network.handleUpdate(res)

    return new Chat(res.chats[0])
}
