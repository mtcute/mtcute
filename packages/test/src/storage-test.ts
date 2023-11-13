import Long from 'long'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { ITelegramStorage, MaybeAsync } from '@mtcute/core'
import { defaultProductionDc, hexEncode, Logger, LogManager, TlReaderMap, TlWriterMap } from '@mtcute/core/utils.js'
import { tl } from '@mtcute/tl'
import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlWriterMap } from '@mtcute/tl/binary/writer.js'

import { createStub } from './stub.js'

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

function maybeHexEncode(x: Uint8Array | null): string | null {
    if (x == null) return null

    return hexEncode(x)
}

export function testStorage<T extends ITelegramStorage>(
    s: T,
    params?: {
        skipEntityOverwrite?: boolean
        customTests?: (s: T) => void
    },
): void {
    beforeAll(async () => {
        const logger = new LogManager()
        logger.level = 0
        s.setup?.(logger, __tlReaderMap, __tlWriterMap)

        await s.load?.()
    })

    afterAll(() => s.destroy?.())
    beforeEach(() => s.reset(true))

    describe('default dc', () => {
        it('should store', async () => {
            await s.setDefaultDcs(defaultProductionDc)
            expect(await s.getDefaultDcs()).toEqual(defaultProductionDc)
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

            expect(maybeHexEncode(await s.getAuthKeyFor(2))).toEqual(hexEncode(key2))
            expect(maybeHexEncode(await s.getAuthKeyFor(3))).toEqual(hexEncode(key3))
        })

        it('should store temp auth keys', async () => {
            const expire = Date.now() + 1000

            await s.setTempAuthKeyFor(2, 0, key2i0, expire)
            await s.setTempAuthKeyFor(2, 1, key2i1, expire)
            await s.setTempAuthKeyFor(3, 0, key3i0, expire)
            await s.setTempAuthKeyFor(3, 1, key3i1, expire)

            expect(maybeHexEncode(await s.getAuthKeyFor(2, 0))).toEqual(hexEncode(key2i0))
            expect(maybeHexEncode(await s.getAuthKeyFor(2, 1))).toEqual(hexEncode(key2i1))
            expect(maybeHexEncode(await s.getAuthKeyFor(3, 0))).toEqual(hexEncode(key3i0))
            expect(maybeHexEncode(await s.getAuthKeyFor(3, 1))).toEqual(hexEncode(key3i1))
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
            expect(maybeHexEncode(await s.getAuthKeyFor(3))).toEqual(hexEncode(key3)) // should not be removed
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
            expect(maybeHexEncode(await s.getAuthKeyFor(3))).toEqual(hexEncode(key3)) // should not be removed
        })

        it('should not reset auth keys on reset()', async () => {
            await s.setAuthKeyFor(2, key2)
            await s.setAuthKeyFor(3, key3)
            s.reset()

            expect(maybeHexEncode(await s.getAuthKeyFor(2))).toEqual(hexEncode(key2))
            expect(maybeHexEncode(await s.getAuthKeyFor(3))).toEqual(hexEncode(key3))
        })

        it('should reset auth keys on reset(true)', async () => {
            await s.setAuthKeyFor(2, key2)
            await s.setAuthKeyFor(3, key3)
            s.reset(true)

            expect(await s.getAuthKeyFor(2)).toBeNull()
            expect(await s.getAuthKeyFor(3)).toBeNull()
        })
    })

    describe('peers', () => {
        it('should cache and return peers', async () => {
            await s.updatePeers([stubPeerUser, peerChannel])
            await s.save?.() // update-related methods are batched, so we need to save

            expect(await s.getPeerById(stubPeerUser.id)).toEqual(peerUserInput)
            expect(await s.getPeerById(peerChannel.id)).toEqual(peerChannelInput)
        })

        it('should cache and return peers by username', async () => {
            await s.updatePeers([stubPeerUser, peerChannel])
            await s.save?.() // update-related methods are batched, so we need to save

            expect(await s.getPeerByUsername(stubPeerUser.username!)).toEqual(peerUserInput)
            expect(await s.getPeerByUsername(peerChannel.username!)).toEqual(peerChannelInput)
        })

        it('should cache and return peers by phone', async () => {
            await s.updatePeers([stubPeerUser])
            await s.save?.() // update-related methods are batched, so we need to save

            expect(await s.getPeerByPhone(stubPeerUser.phone!)).toEqual(peerUserInput)
        })

        if (!params?.skipEntityOverwrite) {
            it('should overwrite existing cached peers', async () => {
                await s.updatePeers([stubPeerUser])
                await s.updatePeers([{ ...stubPeerUser, username: 'whatever' }])
                await s.save?.() // update-related methods are batched, so we need to save

                expect(await s.getPeerById(stubPeerUser.id)).toEqual(peerUserInput)
                expect(await s.getPeerByUsername(stubPeerUser.username!)).toBeNull()
                expect(await s.getPeerByUsername('whatever')).toEqual(peerUserInput)
            })
        }

        it('should cache full peer info', async () => {
            await s.updatePeers([stubPeerUser, peerChannel])
            await s.save?.() // update-related methods are batched, so we need to save

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
            await s.save?.() // update-related methods are batched, so we need to save

            expect(await s.getUpdatesState()).toEqual([1, 2, 3, 4])
        })

        it('should store and return channel pts', async () => {
            await s.setManyChannelPts(
                new Map([
                    [1, 2],
                    [3, 4],
                ]),
            )
            await s.save?.() // update-related methods are batched, so we need to save

            expect(await s.getChannelPts(1)).toEqual(2)
            expect(await s.getChannelPts(3)).toEqual(4)
            expect(await s.getChannelPts(2)).toBeNull()
        })

        it('should be null after reset', async () => {
            expect(await s.getUpdatesState()).toBeNull()
        })
    })

    params?.customTests?.(s)
}

interface IStateStorage {
    setup?(log: Logger, readerMap: TlReaderMap, writerMap: TlWriterMap): void

    load?(): MaybeAsync<void>

    save?(): MaybeAsync<void>

    destroy?(): MaybeAsync<void>

    reset(): MaybeAsync<void>

    getState(key: string): MaybeAsync<unknown>

    setState(key: string, state: unknown, ttl?: number): MaybeAsync<void>

    deleteState(key: string): MaybeAsync<void>

    getCurrentScene(key: string): MaybeAsync<string | null>

    setCurrentScene(key: string, scene: string, ttl?: number): MaybeAsync<void>

    deleteCurrentScene(key: string): MaybeAsync<void>

    getRateLimit(key: string, limit: number, window: number): MaybeAsync<[number, number]>

    resetRateLimit(key: string): MaybeAsync<void>
}

export function testStateStorage(s: IStateStorage) {
    beforeAll(async () => {
        const logger = new LogManager()
        logger.level = 0
        s.setup?.(logger, __tlReaderMap, __tlWriterMap)

        await s.load?.()
    })

    afterAll(() => s.destroy?.())
    beforeEach(() => s.reset())

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
