import { TelegramClient } from '../../client'
import {
    Dialog,
    InputPeerLike,
} from '../../types'
import { MaybeArray } from '@mtqt/core'

/**
 * Get dialogs with certain peers.
 *
 * @param peers  Peers for which to fetch dialogs.
 * @internal
 */
export async function getPeerDialogs(
    this: TelegramClient,
    peers: InputPeerLike
): Promise<Dialog>
/**
 * Get dialogs with certain peers.
 *
 * @param peers  Peers for which to fetch dialogs.
 * @internal
 */
export async function getPeerDialogs(
    this: TelegramClient,
    peers: InputPeerLike[]
): Promise<Dialog[]>

/**
 * @internal
 */
export async function getPeerDialogs(
    this: TelegramClient,
    peers: MaybeArray<InputPeerLike>
): Promise<MaybeArray<Dialog>> {
    const isSingle = !Array.isArray(peers)
    if (isSingle) peers = [peers as InputPeerLike]

    const res = await this.call({
        _: 'messages.getPeerDialogs',
        peers: await this.resolvePeerMany(peers as InputPeerLike[]).then(
            (peers) =>
                peers.map((it) => ({
                    _: 'inputDialogPeer',
                    peer: it,
                }))
        ),
    })

    const dialogs = this._parseDialogs(res)
    return isSingle ? dialogs[0] : dialogs
}
