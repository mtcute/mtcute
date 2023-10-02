import { TelegramClient } from '../../client'
import { Chat } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Create a new supergroup
 *
 * @returns  Newly created supergroup
 * @internal
 */
export async function createSupergroup(
    this: TelegramClient,
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
         * TTL period (in seconds) for the newly created channel
         *
         * @default 0 (i.e. messages don't expire)
         */
        ttlPeriod?: number
    },
): Promise<Chat> {
    const { title, description = '', forum, ttlPeriod = 0 } = params

    const res = await this.call({
        _: 'channels.createChannel',
        title,
        about: description,
        megagroup: true,
        forum,
        ttlPeriod,
    })

    assertIsUpdatesGroup('channels.createChannel', res)

    this._handleUpdate(res)

    return new Chat(this, res.chats[0])
}
