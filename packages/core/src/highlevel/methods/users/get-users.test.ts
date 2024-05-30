import Long from 'long'
import { beforeAll, describe, expect, it } from 'vitest'

import { createStub, StubTelegramClient } from '@mtcute/test'

import { assertTypeIs } from '../../../utils/type-assertions.js'
import { User } from '../../types/index.js'
import { getUsers } from './get-users.js'

describe('getUsers', () => {
    const client = new StubTelegramClient()

    client.respondWith('users.getUsers', ({ id }) =>
        id.map((it) => {
            assertTypeIs('', it, 'inputUser')

            if (it.userId === 1) return { _: 'userEmpty', id: 1 }

            return createStub('user', { id: it.userId, accessHash: Long.ZERO })
        }),
    )

    beforeAll(async () => {
        await client.registerPeers(
            createStub('user', {
                id: 123,
                accessHash: Long.fromBits(123, 456),
            }),
            createStub('user', {
                id: 456,
                accessHash: Long.fromBits(123, 456),
            }),
            createStub('user', {
                id: 1,
                accessHash: Long.fromBits(123, 456),
            }),
        )
    })

    it('should return users returned by users.getUsers', async () => {
        expect(await getUsers(client, [123, 456])).toEqual([
            new User(createStub('user', { id: 123, accessHash: Long.ZERO })),
            new User(createStub('user', { id: 456, accessHash: Long.ZERO })),
        ])
    })

    it('should work for one user', async () => {
        expect(await getUsers(client, 123)).toEqual([new User(createStub('user', { id: 123, accessHash: Long.ZERO }))])
    })

    it('should return null for userEmpty', async () => {
        expect(await getUsers(client, 1)).toEqual([null])
    })
})
