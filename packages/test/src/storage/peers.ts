import type { IPeersRepository, IStorageDriver } from '@mtcute/core'
import { TlBinaryWriter } from '@mtcute/core/utils.js'
import { __tlWriterMap } from '@mtcute/tl/binary/writer.js'
import { describe, expect, it, vi } from 'vitest'

import { createStub } from '../stub.js'

export function fakePeersRepository(): IPeersRepository {
    return {
        getById: vi.fn(),
        getByUsername: vi.fn(),
        getByPhone: vi.fn(),
        store: vi.fn(),
        deleteAll: vi.fn(),
    }
}

function fixPeerInfo(peer: IPeersRepository.PeerInfo | null): IPeersRepository.PeerInfo | null {
    if (!peer) return peer

    return {
        ...peer,
        complete:
            // eslint-disable-next-line no-restricted-globals
            typeof Buffer !== 'undefined' && peer.complete instanceof Buffer
                ? new Uint8Array(peer.complete)
                : peer.complete,
    }
}

export function testPeersRepository(repo: IPeersRepository, driver: IStorageDriver): void {
    const stubPeerUser: IPeersRepository.PeerInfo = {
        id: 123123,
        accessHash: '123|456',
        isMin: false,
        usernames: ['some_user'],
        phone: '78005553535',
        updated: 666,
        complete: TlBinaryWriter.serializeObject(__tlWriterMap, createStub('user', { id: 123123 })),
    }

    const stubPeerChannel: IPeersRepository.PeerInfo = {
        id: -1001183945448,
        accessHash: '666|555',
        isMin: false,
        usernames: ['some_channel'],
        updated: 777,
        complete: TlBinaryWriter.serializeObject(__tlWriterMap, createStub('channel', { id: 123123 })),
    }

    const stupPeerMinUser: IPeersRepository.PeerInfo = { ...stubPeerUser, isMin: true }

    describe('peers', () => {
        it('should be empty by default', async () => {
            expect(await repo.getById(123123)).toEqual(null)
            expect(await repo.getByUsername('some_user')).toEqual(null)
            expect(await repo.getByPhone('phone')).toEqual(null)
        })

        it('should store and retrieve peers', async () => {
            await repo.store(stubPeerUser)
            await repo.store(stubPeerChannel)
            await driver.save?.()

            expect(fixPeerInfo(await repo.getById(123123))).toEqual(stubPeerUser)
            expect(fixPeerInfo(await repo.getByUsername('some_user'))).toEqual(stubPeerUser)
            expect(fixPeerInfo(await repo.getByPhone('78005553535'))).toEqual(stubPeerUser)

            expect(fixPeerInfo(await repo.getById(-1001183945448))).toEqual(stubPeerChannel)
            expect(fixPeerInfo(await repo.getByUsername('some_channel'))).toEqual(stubPeerChannel)
        })

        it('should update peers usernames', async () => {
            await repo.store(stubPeerUser)
            await driver.save?.()

            const modUser = { ...stubPeerUser, usernames: ['some_user2'] }
            await repo.store(modUser)
            await driver.save?.()

            expect(fixPeerInfo(await repo.getById(123123))).toEqual(modUser)
            expect(await repo.getByUsername('some_user')).toEqual(null)
            expect(fixPeerInfo(await repo.getByUsername('some_user2'))).toEqual(modUser)
        })

        it('only getById should return min peers', async () => {
            await repo.deleteAll()
            await repo.store(stupPeerMinUser)
            await driver.save?.()

            expect(await repo.getByUsername('some_user')).toEqual(null)
            expect(await repo.getByPhone('78005553535')).toEqual(null)

            expect(fixPeerInfo(await repo.getById(123123))).toEqual(stupPeerMinUser)
        })
    })
}
