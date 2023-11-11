import Long from 'long'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IStateStorage } from '@mtcute/dispatcher'
import { createStub } from '@mtcute/test'
import { tl } from '@mtcute/tl'
import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlWriterMap } from '@mtcute/tl/binary/writer.js'

import { defaultProductionDc } from '../utils/default-dcs.js'
import { LogManager } from '../utils/index.js'
import { ITelegramStorage } from './abstract.js'

export const stubPeerUser: ITelegramStorage.PeerInfo = {
    id: 123123,
    accessHash: Long.fromBits(123, 456),
    type: 'user',
    username: 'some_user',
    phone: '78005553535',
    full: createStub('user', { id: 123123 }),
}
const peerUserInput: tl.TypeInputPeer = {
    _: 'inputPeerUser',
    userId: 123123,
    accessHash: Long.fromBits(123, 456),
}

const peerChannel: ITelegramStorage.PeerInfo = {
    id: -1001183945448,
    accessHash: Long.fromBits(666, 555),
    type: 'channel',
    username: 'some_channel',
    full: createStub('channel', { id: 123123 }),
}

const peerChannelInput: tl.TypeInputPeer = {
    _: 'inputPeerChannel',
    channelId: 1183945448,
    accessHash: Long.fromBits(666, 555),
}

export function testStorage(s: ITelegramStorage): void {
    beforeAll(async () => {
        await s.load?.()

        const logger = new LogManager()
        logger.level = 0
        s.setup?.(logger, __tlReaderMap, __tlWriterMap)
    })

    afterAll(() => s.destroy?.())
    beforeEach(() => s.reset?.())

    describe('default dc', () => {
        it('should store', async () => {
            await s.setDefaultDcs(defaultProductionDc)
            expect(await s.getDefaultDcs()).toBe(defaultProductionDc)
        })

        it('should remove', async () => {
            await s.setDefaultDcs(null)
            expect(await s.getDefaultDcs()).toBeNull()
        })
    })

    describe('auth keys', () => {
        beforeAll(() => void vi.useFakeTimers())
        afterAll(() => void vi.useRealTimers())

        const key2 = new Uint8Array(256).fill(0x42)
        const key3 = new Uint8Array(256).fill(0x43)

        const key2i0 = new Uint8Array(256).fill(0x44)
        const key2i1 = new Uint8Array(256).fill(0x45)
        const key3i0 = new Uint8Array(256).fill(0x46)
        const key3i1 = new Uint8Array(256).fill(0x47)

        it('should store perm auth key', async () => {
            await s.setAuthKeyFor(2, key2)
            await s.setAuthKeyFor(3, key3)

            expect(await s.getAuthKeyFor(2)).toEqual(key2)
            expect(await s.getAuthKeyFor(3)).toEqual(key3)
        })

        it('should store temp auth keys', async () => {
            const expire = Date.now() + 1000

            await s.setTempAuthKeyFor(2, 0, key2i0, expire)
            await s.setTempAuthKeyFor(2, 1, key2i1, expire)
            await s.setTempAuthKeyFor(3, 0, key3i0, expire)
            await s.setTempAuthKeyFor(3, 1, key3i1, expire)

            expect(await s.getAuthKeyFor(2, 0)).toEqual(key2i0)
            expect(await s.getAuthKeyFor(2, 1)).toEqual(key2i1)
            expect(await s.getAuthKeyFor(3, 0)).toEqual(key3i0)
            expect(await s.getAuthKeyFor(3, 1)).toEqual(key3i1)
        })

        it('should expire temp auth keys', async () => {
            const expire = Date.now() + 1000

            await s.setTempAuthKeyFor(2, 0, key2i0, expire)
            await s.setTempAuthKeyFor(2, 1, key2i1, expire)
            await s.setTempAuthKeyFor(3, 0, key3i0, expire)
            await s.setTempAuthKeyFor(3, 1, key3i1, expire)

            vi.advanceTimersByTime(10000)

            expect(await s.getAuthKeyFor(2, 0)).toBeNull()
            expect(await s.getAuthKeyFor(2, 1)).toBeNull()
            expect(await s.getAuthKeyFor(3, 0)).toBeNull()
            expect(await s.getAuthKeyFor(3, 1)).toBeNull()
        })

        it('should remove auth keys', async () => {
            const expire = Date.now() + 1000

            await s.setTempAuthKeyFor(2, 0, key2i0, expire)
            await s.setTempAuthKeyFor(2, 1, key2i1, expire)
            await s.setAuthKeyFor(2, key2)
            await s.setAuthKeyFor(3, key3)

            await s.setAuthKeyFor(2, null)
            await s.setTempAuthKeyFor(2, 0, null, 0)
            await s.setTempAuthKeyFor(2, 1, null, 0)

            expect(await s.getAuthKeyFor(2)).toBeNull()
            expect(await s.getAuthKeyFor(2, 0)).toBeNull()
            expect(await s.getAuthKeyFor(2, 1)).toBeNull()
            expect(await s.getAuthKeyFor(3)).toEqual(key3) // should not be removed
        })

        it('should remove all auth keys with dropAuthKeysFor', async () => {
            const expire = Date.now() + 1000

            await s.setTempAuthKeyFor(2, 0, key2i0, expire)
            await s.setTempAuthKeyFor(2, 1, key2i1, expire)
            await s.setAuthKeyFor(2, key2)
            await s.setAuthKeyFor(3, key3)

            await s.dropAuthKeysFor(2)

            expect(await s.getAuthKeyFor(2)).toBeNull()
            expect(await s.getAuthKeyFor(2, 0)).toBeNull()
            expect(await s.getAuthKeyFor(2, 1)).toBeNull()
            expect(await s.getAuthKeyFor(3)).toEqual(key3) // should not be removed
        })
    })

    describe('peers', () => {
        it('should cache and return peers', async () => {
            await s.updatePeers([stubPeerUser, peerChannel])

            expect(await s.getPeerById(stubPeerUser.id)).toEqual(peerUserInput)
            expect(await s.getPeerById(peerChannel.id)).toEqual(peerChannelInput)
        })

        it('should cache and return peers by username', async () => {
            await s.updatePeers([stubPeerUser, peerChannel])

            expect(await s.getPeerByUsername(stubPeerUser.username!)).toEqual(peerUserInput)
            expect(await s.getPeerByUsername(peerChannel.username!)).toEqual(peerChannelInput)
        })

        it('should cache and return peers by phone', async () => {
            await s.updatePeers([stubPeerUser])

            expect(await s.getPeerByPhone(stubPeerUser.phone!)).toEqual(peerUserInput)
        })

        it('should overwrite existing cached peers', async () => {
            await s.updatePeers([stubPeerUser])
            await s.updatePeers([{ ...stubPeerUser, username: 'whatever' }])

            expect(await s.getPeerById(stubPeerUser.id)).toEqual(peerUserInput)
            expect(await s.getPeerByUsername(stubPeerUser.username!)).toBeNull()
            expect(await s.getPeerByUsername('whatever')).toEqual(peerUserInput)
        })

        it('should cache full peer info', async () => {
            await s.updatePeers([stubPeerUser, peerChannel])

            expect(await s.getFullPeerById(stubPeerUser.id)).toEqual(stubPeerUser.full)
            expect(await s.getFullPeerById(peerChannel.id)).toEqual(peerChannel.full)
        })
    })

    describe('current user', () => {
        const self: ITelegramStorage.SelfInfo = {
            userId: 123123,
            isBot: false,
        }

        it('should store and return self info', async () => {
            await s.setSelf(self)
            expect(await s.getSelf()).toEqual(self)
        })

        it('should remove self info', async () => {
            await s.setSelf(self)
            await s.setSelf(null)
            expect(await s.getSelf()).toBeNull()
        })
    })

    describe('updates state', () => {
        it('should store and return updates state', async () => {
            await s.setUpdatesPts(1)
            await s.setUpdatesQts(2)
            await s.setUpdatesDate(3)
            await s.setUpdatesSeq(4)
            expect(await s.getUpdatesState()).toEqual([1, 2, 3, 4])
        })

        it('should store and return channel pts', async () => {
            await s.setManyChannelPts(
                new Map([
                    [1, 2],
                    [3, 4],
                ]),
            )

            expect(await s.getChannelPts(1)).toEqual(2)
            expect(await s.getChannelPts(3)).toEqual(4)
            expect(await s.getChannelPts(2)).toBeNull()
        })

        it('should be null after reset', async () => {
            expect(await s.getUpdatesState()).toBeNull()
        })
    })
}

export function testStateStorage(s: IStateStorage) {
    describe('key-value state', () => {
        beforeAll(() => void vi.useFakeTimers())
        afterAll(() => void vi.useRealTimers())

        it('should store and return state', async () => {
            await s.setState('a', 'b')
            await s.setState('c', 'd')
            await s.setState('e', 'f')

            expect(await s.getState('a')).toEqual('b')
            expect(await s.getState('c')).toEqual('d')
            expect(await s.getState('e')).toEqual('f')
        })

        it('should remove state', async () => {
            await s.setState('a', 'b')
            await s.setState('c', 'd')
            await s.setState('e', 'f')

            await s.deleteState('a')
            await s.deleteState('c')
            await s.deleteState('e')

            expect(await s.getState('a')).toBeNull()
            expect(await s.getState('c')).toBeNull()
            expect(await s.getState('e')).toBeNull()
        })

        it('should expire state', async () => {
            await s.setState('a', 'b', 1)
            await s.setState('c', 'd', 1)
            await s.setState('e', 'f', 1)

            vi.advanceTimersByTime(10000)

            expect(await s.getState('a')).toBeNull()
            expect(await s.getState('c')).toBeNull()
            expect(await s.getState('e')).toBeNull()
        })
    })

    describe('scenes', () => {
        it('should store and return scenes', async () => {
            await s.setCurrentScene('a', 'b')
            await s.setCurrentScene('c', 'd')
            await s.setCurrentScene('e', 'f')

            expect(await s.getCurrentScene('a')).toEqual('b')
            expect(await s.getCurrentScene('c')).toEqual('d')
            expect(await s.getCurrentScene('e')).toEqual('f')
        })

        it('should remove scenes', async () => {
            await s.setCurrentScene('a', 'b')
            await s.setCurrentScene('c', 'd')
            await s.setCurrentScene('e', 'f')

            await s.deleteCurrentScene('a')
            await s.deleteCurrentScene('c')
            await s.deleteCurrentScene('e')

            expect(await s.getCurrentScene('a')).toBeNull()
            expect(await s.getCurrentScene('c')).toBeNull()
            expect(await s.getCurrentScene('e')).toBeNull()
        })
    })

    describe('rate limit', () => {
        beforeAll(() => void vi.useFakeTimers())
        afterAll(() => void vi.useRealTimers())

        const check = () => s.getRateLimit('test', 3, 1)

        it('should implement basic rate limiting', async () => {
            vi.setSystemTime(0)

            expect(await check()).toEqual([3, 1000])
            expect(await check()).toEqual([2, 1000])
            expect(await check()).toEqual([1, 1000])
            expect(await check()).toEqual([0, 1000])

            vi.setSystemTime(1001)

            expect(await check()).toEqual([3, 2001])
        })

        it('should allow resetting rate limit', async () => {
            vi.setSystemTime(0)

            await check()
            await check()

            await s.resetRateLimit('test')
            expect(await check()).toEqual([3, 1000])
        })
    })
}
