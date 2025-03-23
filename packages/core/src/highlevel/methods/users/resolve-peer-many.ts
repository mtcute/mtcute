import type { tl } from '@mtcute/tl'
import type { ITelegramClient } from '../../client.types.js'

import type { InputPeerLike } from '../../types/peers/index.js'
import { parallelMap } from '@fuman/utils'
import { MtPeerNotFoundError } from '../../types/errors.js'

import { resolvePeer } from './resolve-peer.js'

/**
 * Get multiple `InputPeer`s at once,
 * while also normalizing and removing
 * peers that can't be normalized to that type.
 *
 * If a peer was not found, it will be skipped.
 *
 * Uses async pool internally, with a concurrent limit of 8
 *
 * @param peerIds  Peer Ids
 * @param normalizer  Normalization function
 */
export async function resolvePeerMany<T extends tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel>(
    client: ITelegramClient,
    peerIds: InputPeerLike[],
    normalizer: (obj: tl.TypeInputPeer) => T | null,
): Promise<T[]>

/**
 * Get multiple `InputPeer`s at once.
 *
 * If a peer was not found, `null` will be returned instead
 *
 * Uses async pool internally, with a concurrent limit of 8
 *
 * @param peerIds  Peer Ids
 */
export async function resolvePeerMany(
    client: ITelegramClient,
    peerIds: InputPeerLike[],
): Promise<(tl.TypeInputPeer | null)[]>

/**
 * @internal
 */
export async function resolvePeerMany(
    client: ITelegramClient,
    peerIds: InputPeerLike[],
    normalizer?: (obj: tl.TypeInputPeer) => tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel | null,
): Promise<(tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel | null)[]> {
    const ret: (tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel | null)[] = []

    const limit = 8

    if (peerIds.length < limit) {
        // no point in using async pool for <limit peers
        const res = await Promise.all(
            peerIds.map(it =>
                resolvePeer(client, it).catch((e) => {
                    if (e instanceof MtPeerNotFoundError) {
                        return null
                    }
                    throw e
                }),
            ),
        )

        if (!normalizer) return res

        for (const value of res) {
            if (!value) continue
            const norm = normalizer(value)

            if (norm) {
                ret.push(norm)
            }
        }

        return ret
    }

    return parallelMap(peerIds, async (it) => {
        let peer
        try {
            peer = await resolvePeer(client, it)
        } catch (e) {
            if (e instanceof MtPeerNotFoundError) {
                return null
            }
            throw e
        }

        if (normalizer) return normalizer(peer)
        return peer
    }, { limit })
}
