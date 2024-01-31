import { ITelegramClient } from '../../client.types.js'
import { Chat } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'

/**
 * Create a new supergroup
 *
 * @returns  Newly created supergroup
 */
export async function createSupergroup(
    client: ITelegramClient,
    params: {
        /**
         * Supergroup title
         */
        title: string

        /**
         * Supergroup description
         */
        description?: string

        /**
         * Whether to create a forum
         */
        forum?: boolean

        /**
         * TTL period (in seconds) for the newly created supergroup
         *
         * @default 0 (i.e. messages don't expire)
         */
        ttlPeriod?: number
    },
): Promise<Chat> {
    const { title, description = '', forum, ttlPeriod = 0 } = params

    const res = await client.call({
        _: 'channels.createChannel',
        title,
        about: description,
        megagroup: true,
        forum,
        ttlPeriod,
    })

    assertIsUpdatesGroup('channels.createChannel', res)

    client.handleClientUpdate(res)

    return new Chat(res.chats[0])
}
