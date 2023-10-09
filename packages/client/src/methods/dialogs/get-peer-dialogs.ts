import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { Dialog } from '../../types/messages/dialog'
import { InputPeerLike } from '../../types/peers'
import { resolvePeerMany } from '../users/resolve-peer-many'

/**
 * Get dialogs with certain peers.
 *
 * @param peers  Peers for which to fetch dialogs.
 */
export async function getPeerDialogs(client: BaseTelegramClient, peers: MaybeArray<InputPeerLike>): Promise<Dialog[]> {
    if (!Array.isArray(peers)) peers = [peers]

    const res = await client.call({
        _: 'messages.getPeerDialogs',
        peers: await resolvePeerMany(client, peers).then((peers) =>
            peers.map((it) => ({
                _: 'inputDialogPeer',
                peer: it,
            })),
        ),
    })

    return Dialog.parseTlDialogs(res)
}
