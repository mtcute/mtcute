import { tl } from '@mtcute/tl'

import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types/index.js'
import { normalizeDate } from '../../utils/misc-utils.js'
import { isInputPeerChannel, toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Restrict a user in a supergroup.
 */
export async function restrictChatMember(
    client: ITelegramClient,
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

    const chat = await resolvePeer(client, chatId)

    if (!isInputPeerChannel(chat)) {
        throw new MtInvalidPeerTypeError(chatId, 'channel')
    }

    const user = await resolvePeer(client, userId)

    const res = await client.call({
        _: 'channels.editBanned',
        channel: toInputChannel(chat),
        participant: user,
        bannedRights: {
            _: 'chatBannedRights',
            untilDate: normalizeDate(until) ?? 0,
            ...restrictions,
        },
    })
    client.handleClientUpdate(res)
}
