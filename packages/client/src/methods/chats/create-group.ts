import { MaybeArray } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { Chat, InputPeerLike } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Create a legacy group chat
 *
 * If you want to create a supergroup, use {@link createSupergroup}
 * instead.
 *
 * @internal
 */
export async function createGroup(
    this: TelegramClient,
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

    const peers = await this.resolvePeerMany(users, normalizeToInputUser)

    const res = await this.call({
        _: 'messages.createChat',
        title,
        users: peers,
    })

    assertIsUpdatesGroup('messages.createChat', res)

    this._handleUpdate(res)

    return new Chat(this, res.chats[0])
}
