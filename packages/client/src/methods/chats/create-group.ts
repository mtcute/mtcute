import { TelegramClient } from '../../client'
import { MaybeArray } from '@mtcute/core'
import { Chat, InputPeerLike, MtCuteTypeAssertionError } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'

/**
 * Create a legacy group chat
 *
 * If you want to create a supergroup, use {@link createSupergroup}
 * instead.
 *
 * @param title  Group title
 * @param users
 *   User(s) to be invited in the group (ID(s), username(s) or phone number(s)).
 *   Due to Telegram limitations, you can't create a legacy group with yourself.
 * @internal
 */
export async function createGroup(
    this: TelegramClient,
    title: string,
    users: MaybeArray<InputPeerLike>
): Promise<Chat> {
    if (!Array.isArray(users)) users = [users]

    const peers =  await this.resolvePeerMany(
        users as InputPeerLike[],
        normalizeToInputUser
    )

    const res = await this.call({
        _: 'messages.createChat',
        title,
        users: peers
    })

    if (!(res._ === 'updates' || res._ === 'updatesCombined')) {
        throw new MtCuteTypeAssertionError(
            'messages.createChat',
            'updates | updatesCombined',
            res._
        )
    }

    this._handleUpdate(res)

    return new Chat(this, res.chats[0])
}
