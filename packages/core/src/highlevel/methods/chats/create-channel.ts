import { ITelegramClient } from '../../client.types.js'
import { Chat } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'

/**
 * Create a new broadcast channel
 *
 * @returns  Newly created channel
 */
export async function createChannel(
    client: ITelegramClient,
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

    client.handleClientUpdate(res)

    return new Chat(res.chats[0])
}
