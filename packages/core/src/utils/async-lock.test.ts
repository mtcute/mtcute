import { describe, expect, it } from 'vitest'

import { AsyncLock } from './async-lock.js'
import { sleep } from './misc-utils.js'

describe('AsyncLock', () => {
    it('should correctly lock execution', async () => {
        const lock = new AsyncLock()

        const log: number[] = []
        await Promise.all(
            Array.from({ length: 10 }, (_, idx) =>
                lock.with(async () => {
                    await sleep(10 - idx)
                    log.push(idx)
                }),
            ),
        )

        expect(log).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('should correctly propagate errors', async () => {
        const lock = new AsyncLock()

        await expect(async () => {
            await lock.with(() => {
                throw new Error('test')
            })
        }).rejects.toThrow('test')
    })
})
