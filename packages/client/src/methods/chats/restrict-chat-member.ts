import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import { normalizeDate } from '../../utils/misc-utils'
import { isInputPeerChannel, normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Restrict a user in a supergroup.
 *
 * @param chatId  Chat ID
 * @param userId  User ID
 * @param restrictions
 *     Restrictions for the user. Note that unlike Bot API, this object contains
 *     the restrictions, and not the permissions, i.e. to
 *     passing `sendMessages=true` will disallow the user to send messages,
 *     and passing `{}` (empty object) will lift any restrictions
 * @param until
 *     Date when the user will be unrestricted.
 *     When `number` is passed, UNIX time in ms is expected.
 *     If this value is less than 30 seconds or more than 366 days in
 *     the future, user will be restricted forever. Defaults to `0` (forever)
 * @internal
 */
export async function restrictChatMember(
    this: TelegramClient,
    chatId: InputPeerLike,
    userId: InputPeerLike,
    restrictions: Omit<tl.RawChatBannedRights, '_' | 'untilDate'>,
    until?: number | Date,
): Promise<void> {
    const chat = await this.resolvePeer(chatId)

    if (!isInputPeerChannel(chat)) {
        throw new MtInvalidPeerTypeError(chatId, 'channel')
    }

    const user = await this.resolvePeer(userId)

    const res = await this.call({
        _: 'channels.editBanned',
        channel: normalizeToInputChannel(chat),
        participant: user,
        bannedRights: {
            _: 'chatBannedRights',
            untilDate: normalizeDate(until) ?? 0,
            ...restrictions,
        },
    })
    this._handleUpdate(res)
}
