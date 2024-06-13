import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/peers/index.js'
import { isInputPeerChannel } from '../../utils/peer-utils.js'
import { getPeerDialogs } from '../dialogs/get-peer-dialogs.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Inform the library that the user has opened a chat.
 *
 * Some library logic depends on this, for example, the library will
 * periodically ping the server to keep the updates flowing.
 *
 * > **Warning**: Opening a chat with `openChat` method will make the library make additional requests
 * > every so often. Which means that you should **avoid opening more than 5-10 chats at once**,
 * > as it will probably trigger server-side limits and you might start getting transport errors
 * > or even get banned.
 *
 * @param chat  Chat to open
 */
export async function openChat(client: ITelegramClient, chat: InputPeerLike): Promise<void> {
    const peer = await resolvePeer(client, chat)

    if (isInputPeerChannel(peer)) {
        const [dialog] = await getPeerDialogs(client, peer)

        await client.notifyChannelOpened(peer.channelId, dialog.raw.pts)
    }

    // todo: once we have proper dialogs/peers db, we should also
    // update full info here and fetch auxillary info (like channel members etc)
}

/**
 * Inform the library that the user has closed a chat.
 * Un-does the effect of {@link openChat}.
 *
 * Some library logic depends on this, for example, the library will
 * periodically ping the server to keep the updates flowing.
 *
 * @param chat  Chat to open
 */
export async function closeChat(client: ITelegramClient, chat: InputPeerLike): Promise<void> {
    const peer = await resolvePeer(client, chat)

    if (isInputPeerChannel(peer)) {
        await client.notifyChannelClosed(peer.channelId)
    }

    // todo: once we have proper dialogs/peers db, we should also
    // update full info here and fetch auxillary info (like channel members etc)
}
