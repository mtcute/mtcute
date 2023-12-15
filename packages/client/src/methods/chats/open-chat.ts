import { BaseTelegramClient } from '@mtcute/core'

import { InputPeerLike } from '../../types/peers/index.js'
import { isInputPeerChannel } from '../../utils/peer-utils.js'
import { getPeerDialogs } from '../dialogs/get-peer-dialogs.js'
import { notifyChannelClosed, notifyChannelOpened } from '../updates/manager.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Inform the library that the user has opened a chat.
 *
 * Some library logic depends on this, for example, the library will
 * periodically ping the server to keep the updates flowing.
 *
 * @param chat  Chat to open
 */
export async function openChat(client: BaseTelegramClient, chat: InputPeerLike): Promise<void> {
    const peer = await resolvePeer(client, chat)

    if (isInputPeerChannel(peer)) {
        const [dialog] = await getPeerDialogs(client, peer)

        if (!client.network.params.disableUpdates) {
            notifyChannelOpened(client, peer.channelId, dialog.raw.pts)
        }
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
export async function closeChat(client: BaseTelegramClient, chat: InputPeerLike): Promise<void> {
    const peer = await resolvePeer(client, chat)

    if (isInputPeerChannel(peer) && !client.network.params.disableUpdates) {
        notifyChannelClosed(client, peer.channelId)
    }

    // todo: once we have proper dialogs/peers db, we should also
    // update full info here and fetch auxillary info (like channel members etc)
}
