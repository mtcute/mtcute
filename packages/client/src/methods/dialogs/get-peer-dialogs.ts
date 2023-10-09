import { BaseTelegramClient, MaybeArray } from '@mtcute/core'

import { Dialog } from '../../types/messages/dialog'
import { InputPeerLike } from '../../types/peers'
import { resolvePeerMany } from '../users/resolve-peer-many'

/**
 * Get dialogs with certain peers.
 *
 * @param peers  Peers for which to fetch dialogs.
 */
export async function getPeerDialogs(client: BaseTelegramClient, peers: InputPeerLike): Promise<Dialog>
/**
 * Get dialogs with certain peers.
 *
 * @param peers  Peers for which to fetch dialogs.
 */
export async function getPeerDialogs(client: BaseTelegramClient, peers: InputPeerLike[]): Promise<Dialog[]>

/** @internal */
export async function getPeerDialogs(
    client: BaseTelegramClient,
    peers: MaybeArray<InputPeerLike>,
): Promise<MaybeArray<Dialog>> {
    const isSingle = !Array.isArray(peers)
    if (isSingle) peers = [peers as InputPeerLike]

    const res = await client.call({
        _: 'messages.getPeerDialogs',
        peers: await resolvePeerMany(client, peers as InputPeerLike[]).then((peers) =>
            peers.map((it) => ({
                _: 'inputDialogPeer',
                peer: it,
            })),
        ),
    })

    const dialogs = Dialog.parseTlDialogs(res)

    return isSingle ? dialogs[0] : dialogs
}
