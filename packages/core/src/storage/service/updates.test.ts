import { describe, expect, it, vi } from 'vitest'

import { fakeKeyValueRepository } from '@mtcute/test'

import { UpdatesStateService } from '../../highlevel/storage/service/updates.js'
import { testServiceOptions } from './utils.test-utils.js'

describe('updates state service', () => {
    const kv = fakeKeyValueRepository()
    const service = new UpdatesStateService(kv, testServiceOptions())

    it('should write pts to updates_pts key', async () => {
        await service.setPts(123)

        expect(kv.set).toHaveBeenCalledWith('updates_pts', new Uint8Array([123, 0, 0, 0]))
    })

    it('should write qts to updates_qts key', async () => {
        await service.setQts(123)

        expect(kv.set).toHaveBeenCalledWith('updates_qts', new Uint8Array([123, 0, 0, 0]))
    })

    it('should write date to updates_date key', async () => {
        await service.setDate(123)

        expect(kv.set).toHaveBeenCalledWith('updates_date', new Uint8Array([123, 0, 0, 0]))
    })

    it('should write seq to updates_seq key', async () => {
        await service.setSeq(123)

        expect(kv.set).toHaveBeenCalledWith('updates_seq', new Uint8Array([123, 0, 0, 0]))
    })

    describe('getState', () => {
        it('should read from updates_* keys', async () => {
            await service.getState()

            expect(kv.get).toHaveBeenCalledWith('updates_pts')
            expect(kv.get).toHaveBeenCalledWith('updates_qts')
            expect(kv.get).toHaveBeenCalledWith('updates_date')
            expect(kv.get).toHaveBeenCalledWith('updates_seq')
        })

        it('should return null if no state is stored', async () => {
            vi.mocked(kv.get).mockResolvedValueOnce(null)

            expect(await service.getState()).toEqual(null)
        })
    })

    describe('getChannelPts', () => {
        it('should read from updates_channel:xxx key', async () => {
            await service.getChannelPts(123)

            expect(kv.get).toHaveBeenCalledWith('updates_channel:123')
        })

        it('should return null if no value is stored', async () => {
            vi.mocked(kv.get).mockResolvedValueOnce(null)

            expect(await service.getChannelPts(123)).toEqual(null)
        })

        it('should return the value if it is stored', async () => {
            vi.mocked(kv.get).mockResolvedValueOnce(new Uint8Array([1, 2, 3, 4]))

            expect(await service.getChannelPts(123)).toEqual(0x04030201)
        })
    })

    describe('setChannelPts', () => {
        it('should write to updates_channel:xxx key', async () => {
            await service.setChannelPts(123, 0x04030201)

            expect(kv.set).toHaveBeenCalledWith('updates_channel:123', new Uint8Array([1, 2, 3, 4]))
        })
    })
})
