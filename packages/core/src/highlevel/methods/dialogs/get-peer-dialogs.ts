import { MaybeArray } from '../../../types/utils.js'
import { isPresent } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { Dialog } from '../../types/messages/dialog.js'
import { InputPeerLike } from '../../types/peers/index.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'

/**
 * Get dialogs with certain peers.
 *
 * @param peers  Peers for which to fetch dialogs.
 */
export async function getPeerDialogs(client: ITelegramClient, peers: MaybeArray<InputPeerLike>): Promise<Dialog[]> {
    if (!Array.isArray(peers)) peers = [peers]

    const res = await client.call({
        _: 'messages.getPeerDialogs',
        peers: await resolvePeerMany(client, peers).then((peers) =>
            peers.filter(isPresent).map((it) => ({
                _: 'inputDialogPeer',
                peer: it,
            })),
        ),
    })

    return Dialog.parseTlDialogs(res)
}
