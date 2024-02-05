import { ITelegramClient } from '../../client.types.js'
import { Chat, InputPeerLike } from '../../types/index.js'
import { resolveUser } from './resolve-peer.js'

/**
 * Get a list of common chats you have with a given user
 *
 * @param userId  User's ID, username or phone number
 * @throws MtInvalidPeerTypeError
 */
export async function getCommonChats(client: ITelegramClient, userId: InputPeerLike): Promise<Chat[]> {
    return client
        .call({
            _: 'messages.getCommonChats',
            userId: await resolveUser(client, userId),
            maxId: 0,
            limit: 100,
        })
        .then((res) => res.chats.map((it) => new Chat(it)))
}
