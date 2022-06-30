import { asyncPool } from 'eager-async-pool'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Get multiple `InputPeer`s at once,
 * while also normalizing and removing
 * peers that can't be normalized to that type.
 * Uses `async-eager-pool` internally, with a
 * limit of 10.
 *
 * @param peerIds  Peer Ids
 * @param normalizer  Normalization function
 * @internal
 */
export async function resolvePeerMany<
    T extends tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel
>(
    this: TelegramClient,
    peerIds: InputPeerLike[],
    normalizer: (obj: tl.TypeInputPeer) => T | null
): Promise<T[]>

/**
 * Get multiple `InputPeer`s at once.
 * Uses `async-eager-pool` internally, with a
 * limit of 10.
 *
 * @param peerIds  Peer Ids
 * @internal
 */
export async function resolvePeerMany(
    this: TelegramClient,
    peerIds: InputPeerLike[]
): Promise<tl.TypeInputPeer[]>

/**
 * @internal
 */
export async function resolvePeerMany(
    this: TelegramClient,
    peerIds: InputPeerLike[],
    normalizer?: (
        obj: tl.TypeInputPeer
    ) => tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel | null
): Promise<(tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel)[]> {
    const ret: (tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel)[] =
        []

    if (peerIds.length < 10) {
        // no point in using async pool for <10 peers
        const res = await Promise.all(peerIds.map((it) => this.resolvePeer(it)))

        if (!normalizer) return res

        for (const value of res) {
            const norm = normalizer(value)
            if (norm) {
                ret.push(norm)
            }
        }
    } else {
        for await (const { error, value } of asyncPool(
            (it) => this.resolvePeer(it),
            peerIds,
            {
                limit: 10,
            }
        )) {
            if (error) {
                throw error
            }
            if (!value) continue

            if (!normalizer) {
                ret.push(value)
            } else {
                const norm = normalizer(value)
                if (norm) {
                    ret.push(norm)
                }
            }
        }
    }
    return ret
}
