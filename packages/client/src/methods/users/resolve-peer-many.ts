import { tl } from '@mtcute/core'
import { ConditionVariable } from '@mtcute/core/utils'

import { TelegramClient, TelegramClientOptions } from '../../client'
import { InputPeerLike } from '../../types'

/* eslint-disable @typescript-eslint/no-unused-vars */
// @extension
interface ResolvePeerManyExtension {
    _resolvePeerManyPoolLimit: number
}

// @initialize
function _resolvePeerManyInitializer(this: TelegramClient, opts: TelegramClientOptions) {
    this._resolvePeerManyPoolLimit = opts.resolvePeerManyPoolLimit ?? 8
}
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Get multiple `InputPeer`s at once,
 * while also normalizing and removing
 * peers that can't be normalized to that type.
 *
 * Uses async pool internally, with a
 * configurable concurrent limit (see {@link TelegramClientOptions#resolvePeerManyPoolLimit}).
 *
 * @param peerIds  Peer Ids
 * @param normalizer  Normalization function
 * @internal
 */
export async function resolvePeerMany<T extends tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel>(
    this: TelegramClient,
    peerIds: InputPeerLike[],
    normalizer: (obj: tl.TypeInputPeer) => T | null,
): Promise<T[]>

/**
 * Get multiple `InputPeer`s at once.
 *
 * Uses async pool internally, with a
 * configurable concurrent limit (see {@link TelegramClientOptions#resolvePeerManyPoolLimit}).
 *
 *
 * @param peerIds  Peer Ids
 * @internal
 */
export async function resolvePeerMany(this: TelegramClient, peerIds: InputPeerLike[]): Promise<tl.TypeInputPeer[]>

/**
 * @internal
 */
export async function resolvePeerMany(
    this: TelegramClient,
    peerIds: InputPeerLike[],
    normalizer?: (obj: tl.TypeInputPeer) => tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel | null,
): Promise<(tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel)[]> {
    const ret: (tl.TypeInputPeer | tl.TypeInputUser | tl.TypeInputChannel)[] = []

    const limit = this._resolvePeerManyPoolLimit

    if (peerIds.length < limit) {
        // no point in using async pool for <limit peers
        const res = await Promise.all(peerIds.map((it) => this.resolvePeer(it)))

        if (!normalizer) return res

        for (const value of res) {
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
        const result = await this.resolvePeer(peerIds[idx])

        buffer[idx] = result

        if (nextIdx === idx) {
            cv.notify()
        }

        if (nextWorkerIdx < peerIds.length) {
            await fetchNext(nextWorkerIdx++)
        }
    }

    let error: unknown = undefined
    void Promise.all(Array.from({ length: limit }, (_, i) => fetchNext(i)))
        .catch((e) => {
            this.log.debug('resolvePeerMany errored: %s', e.message)
            error = e
            cv.notify()
        })
        .then(() => {
            this.log.debug('resolvePeerMany finished')
        })

    while (nextIdx < peerIds.length) {
        await cv.wait()

        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        if (error) throw error

        while (nextIdx in buffer) {
            const buf = buffer[nextIdx]
            delete buffer[nextIdx]

            nextIdx++

            if (!buf) continue

            if (!normalizer) {
                ret.push(buf)
            } else {
                const norm = normalizer(buf)

                if (norm) {
                    ret.push(norm)
                }
            }
        }
    }

    return ret
}
