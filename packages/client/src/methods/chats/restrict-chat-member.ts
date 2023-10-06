import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types'
import { normalizeDate } from '../../utils/misc-utils'
import { isInputPeerChannel, normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Restrict a user in a supergroup.
 *
 * @internal
 */
export async function restrictChatMember(
    this: TelegramClient,
    params: {
        /** Chat ID */
        chatId: InputPeerLike

        /** User ID */
        userId: InputPeerLike

        /**
         * Restrictions for the user. Note that unlike Bot API, this object contains
         * the restrictions, and not the permissions, i.e.
         * passing `sendMessages=true` will disallow the user to send messages,
         * and passing `{}` (empty object) will lift any restrictions
         */
        restrictions: Omit<tl.RawChatBannedRights, '_' | 'untilDate'>

        /**
         * Date when the user will be unrestricted.
         * When `number` is passed, UNIX time in ms is expected.
         * If this value is less than 30 seconds or more than 366 days in
         * the future, user will be restricted forever.
         *
         * @default  `0`, i.e. forever
         */
        until?: number | Date
    },
): Promise<void> {
    const { chatId, userId, restrictions, until = 0 } = params

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
