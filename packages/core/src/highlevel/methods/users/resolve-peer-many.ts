import { tl } from '@mtcute/tl'

import { ConditionVariable } from '../../../utils/condition-variable.js'
import { ITelegramClient } from '../../client.types.js'
import { MtPeerNotFoundError } from '../../types/errors.js'
import { InputPeerLike } from '../../types/peers/index.js'
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
            peerIds.map((it) =>
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

    const cv = new ConditionVariable()
    const buffer: Record<number, tl.TypeInputPeer | null> = {}

    let nextIdx = 0
    let nextWorkerIdx = 0

    const fetchNext = async (idx = nextWorkerIdx++): Promise<void> => {
        try {
            const result = await resolvePeer(client, peerIds[idx])
            buffer[idx] = result
        } catch (e) {
            if (e instanceof MtPeerNotFoundError) {
                buffer[idx] = null
            } else throw e
        }

        if (nextIdx === idx) {
            cv.notify()
        }

        if (nextWorkerIdx < peerIds.length) {
            await fetchNext(nextWorkerIdx++)
        }
    }

    let error: unknown = undefined
    void Promise.all(Array.from({ length: limit }, (_, i) => fetchNext(i))).catch((e) => {
        client.log.debug('resolvePeerMany errored: %s', e.message)
        error = e
        cv.notify()
    })

    while (nextIdx < peerIds.length) {
        await cv.wait()

        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        if (error) throw error

        while (nextIdx in buffer) {
            const buf = buffer[nextIdx]
            delete buffer[nextIdx]

            nextIdx++

            if (!normalizer) {
                ret.push(buf)
                continue
            }

            if (buf !== null) {
                const norm = normalizer(buf)

                if (norm) {
                    ret.push(norm)
                }
            }
        }
    }

    return ret
}
