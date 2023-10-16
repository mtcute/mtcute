import { BaseTelegramClient } from '@mtcute/core'

import { Chat, InputPeerLike } from '../../types/index.js'
import { normalizeToInputUser } from '../../utils/peer-utils.js'
import { resolvePeer } from './resolve-peer.js'

/**
 * Get a list of common chats you have with a given user
 *
 * @param userId  User's ID, username or phone number
 * @throws MtInvalidPeerTypeError
 */
export async function getCommonChats(client: BaseTelegramClient, userId: InputPeerLike): Promise<Chat[]> {
    return client
        .call({
            _: 'messages.getCommonChats',
            userId: normalizeToInputUser(await resolvePeer(client, userId), userId),
            maxId: 0,
            limit: 100,
        })
        .then((res) => res.chats.map((it) => new Chat(it)))
}
