import { MaybeArray } from '../../../types/utils.js'
import { ITelegramClient } from '../../client.types.js'
import { Chat, InputPeerLike } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { toInputUser } from '../../utils/peer-utils.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'

/**
 * Create a legacy group chat
 *
 * If you want to create a supergroup, use {@link createSupergroup}
 * instead.
 */
export async function createGroup(
    client: ITelegramClient,
    params: {
        /**
         * Group title
         */
        title: string

        /**
         * User(s) to be invited in the group (ID(s), username(s) or phone number(s)).
         * Due to Telegram limitations, you can't create a legacy group with just yourself.
         */
        users: MaybeArray<InputPeerLike>

        /**
         * TTL period (in seconds) for the newly created chat
         *
         * @default 0 (i.e. messages don't expire)
         */
        ttlPeriod?: number
    },
): Promise<Chat> {
    const { title } = params
    let { users } = params

    if (!Array.isArray(users)) users = [users]

    const peers = await resolvePeerMany(client, users, toInputUser)

    const res = await client.call({
        _: 'messages.createChat',
        title,
        users: peers,
    })

    assertIsUpdatesGroup('messages.createChat', res)

    client.handleClientUpdate(res)

    return new Chat(res.chats[0])
}
