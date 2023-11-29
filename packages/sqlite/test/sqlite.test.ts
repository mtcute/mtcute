import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { stubPeerUser, testStateStorage, testStorage } from '@mtcute/test'

import { SqliteStorage } from '../src/index.js'

if (import.meta.env.TEST_ENV === 'node') {
    describe('SqliteStorage', () => {
        testStorage(new SqliteStorage(), {
            // sqlite implements "unimportant" updates, which are batched once every 30sec (tested below)
            skipEntityOverwrite: true,
            customTests: (s) => {
                describe('batching', () => {
                    beforeAll(() => void vi.useFakeTimers())
                    afterAll(() => void vi.useRealTimers())

                    it('should batch entity writes', async () => {
                        s.updatePeers([stubPeerUser])
                        s.updatePeers([{ ...stubPeerUser, username: 'test123' }])
                        s.save()

                        // eslint-disable-next-line
                        expect(Object.keys(s['_pendingUnimportant'])).toEqual([String(stubPeerUser.id)])
                        // not yet updated
                        expect(s.getPeerByUsername(stubPeerUser.username!)).not.toBeNull()
                        expect(s.getPeerByUsername('test123')).toBeNull()

                        await vi.advanceTimersByTimeAsync(30001)

                        expect(s.getPeerByUsername(stubPeerUser.username!)).toBeNull()
                        expect(s.getPeerByUsername('test123')).not.toBeNull()
                    })

                    it('should batch update state writes', () => {
                        s.setUpdatesPts(123)
                        s.setUpdatesQts(456)
                        s.setUpdatesDate(789)
                        s.setUpdatesSeq(999)

                        // not yet updated
                        expect(s.getUpdatesState()).toBeNull()

                        s.save()

                        expect(s.getUpdatesState()).toEqual([123, 456, 789, 999])
                    })
                })
            },
        })
        testStateStorage(new SqliteStorage())
    })
} else {
    describe.skip('SqliteStorage', () => {})
}
