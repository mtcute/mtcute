import Long from 'long'
import { describe, expect, it, vi } from 'vitest'

import { createStub, StubTelegramClient } from '@mtcute/test'

import { Chat, MtPeerNotFoundError, User } from '../../types/index.js'
import { resolvePeer } from './resolve-peer.js'

describe('resolvePeer', () => {
    it('should extract input peer from User/Chat', async () => {
        const user = new User(
            createStub('user', {
                id: 123,
                accessHash: Long.fromBits(456, 789),
            }),
        )
        const chat = new Chat(
            createStub('channel', {
                id: 123,
                accessHash: Long.fromBits(456, 789),
            }),
        )

        expect(await resolvePeer(StubTelegramClient.offline(), user)).toEqual({
            _: 'inputPeerUser',
            userId: 123,
            accessHash: Long.fromBits(456, 789),
        })
        expect(await resolvePeer(StubTelegramClient.offline(), chat)).toEqual({
            _: 'inputPeerChannel',
            channelId: 123,
            accessHash: Long.fromBits(456, 789),
        })
    })

    it('should extract input peer from tl objects', async () => {
        const user = createStub('inputPeerUser', {
            userId: 123,
            accessHash: Long.fromBits(456, 789),
        })

        expect(await resolvePeer(StubTelegramClient.offline(), user)).toEqual({
            _: 'inputPeerUser',
            userId: 123,
            accessHash: Long.fromBits(456, 789),
        })
    })

    it('should extract input peer from dummy min peers', async () => {
        const client = StubTelegramClient.offline()

        await client.registerPeers(
            createStub('channel', {
                id: 456,
                accessHash: Long.fromBits(111, 222),
            }),
        )
        await client.storage.refMsgs.store(123, -1000000000456, 789)
        await client.storage.refMsgs.store(-1000000000123, -1000000000456, 789)

        const resolved = await resolvePeer(client, {
            _: 'mtcute.dummyInputPeerMinUser',
            userId: 123,
        })
        const resolved2 = await resolvePeer(client, {
            _: 'mtcute.dummyInputPeerMinChannel',
            channelId: 123,
        })

        expect(resolved).toEqual({
            _: 'inputPeerUserFromMessage',
            userId: 123,
            peer: {
                _: 'inputPeerChannel',
                channelId: 456,
                accessHash: Long.fromBits(111, 222),
            },
            msgId: 789,
        })
        expect(resolved2).toEqual({
            _: 'inputPeerChannelFromMessage',
            channelId: 123,
            peer: {
                _: 'inputPeerChannel',
                channelId: 456,
                accessHash: Long.fromBits(111, 222),
            },
            msgId: 789,
        })
    })

    it('should return inputPeerSelf for me/self', async () => {
        expect(await resolvePeer(StubTelegramClient.offline(), 'me')).toEqual({ _: 'inputPeerSelf' })
        expect(await resolvePeer(StubTelegramClient.offline(), 'self')).toEqual({ _: 'inputPeerSelf' })
    })

    describe('resolving by id', () => {
        describe('users', () => {
            it('should first try checking in storage', async () => {
                const client = StubTelegramClient.offline()

                await client.registerPeers(
                    createStub('user', {
                        id: 123,
                        accessHash: Long.fromBits(456, 789),
                    }),
                )

                const resolved = await resolvePeer(client, 123)

                expect(resolved).toEqual({
                    _: 'inputPeerUser',
                    userId: 123,
                    accessHash: Long.fromBits(456, 789),
                })
            })

            it('should try checking for message references in storage', async () => {
                const client = StubTelegramClient.offline()

                await client.registerPeers(
                    createStub('channel', {
                        id: 456,
                        accessHash: Long.fromBits(111, 222),
                    }),
                )
                await client.storage.refMsgs.store(123, -1000000000456, 789)

                const resolved = await resolvePeer(client, 123)

                expect(resolved).toEqual({
                    _: 'inputPeerUserFromMessage',
                    userId: 123,
                    peer: {
                        _: 'inputPeerChannel',
                        channelId: 456,
                        accessHash: Long.fromBits(111, 222),
                    },
                    msgId: 789,
                })
            })

            it('should throw if not in storage', async () => {
                const client = new StubTelegramClient()

                await expect(resolvePeer(client, 123)).rejects.toThrow(MtPeerNotFoundError)
            })
        })

        describe('channels', () => {
            it('should first try checking in storage', async () => {
                const client = StubTelegramClient.offline()

                await client.registerPeers(
                    createStub('channel', {
                        id: 123,
                        accessHash: Long.fromBits(456, 789),
                    }),
                )

                const resolved = await resolvePeer(client, -1000000000123)

                expect(resolved).toEqual({
                    _: 'inputPeerChannel',
                    channelId: 123,
                    accessHash: Long.fromBits(456, 789),
                })
            })

            it('should try checking for message references in storage', async () => {
                const client = StubTelegramClient.offline()

                await client.registerPeers(
                    createStub('channel', {
                        id: 456,
                        accessHash: Long.fromBits(111, 222),
                    }),
                )
                await client.storage.refMsgs.store(-1000000000123, -1000000000456, 789)

                const resolved = await resolvePeer(client, -1000000000123)

                expect(resolved).toEqual({
                    _: 'inputPeerChannelFromMessage',
                    channelId: 123,
                    peer: {
                        _: 'inputPeerChannel',
                        channelId: 456,
                        accessHash: Long.fromBits(111, 222),
                    },
                    msgId: 789,
                })
            })

            it('should throw if not in storage', async () => {
                const client = new StubTelegramClient()

                await expect(resolvePeer(client, -1000000000123)).rejects.toThrow(MtPeerNotFoundError)
            })
        })

        describe('chats', () => {
            it('should correctly resolve', async () => {
                const client = StubTelegramClient.offline()

                const resolved = await resolvePeer(client, -123)

                expect(resolved).toEqual({
                    _: 'inputPeerChat',
                    chatId: 123,
                })
            })
        })

        it('should accept Peer objects', async () => {
            const client = new StubTelegramClient()

            await client.registerPeers(
                createStub('user', {
                    id: 123,
                    accessHash: Long.fromBits(456, 789),
                }),
            )

            const resolved = await resolvePeer(client, { _: 'peerUser', userId: 123 })

            expect(resolved).toEqual({
                _: 'inputPeerUser',
                userId: 123,
                accessHash: Long.fromBits(456, 789),
            })
        })
    })

    describe('resolving by phone number', () => {
        it('should first try checking in storage', async () => {
            const client = StubTelegramClient.offline()

            await client.registerPeers(
                createStub('user', {
                    id: 123,
                    accessHash: Long.fromBits(456, 789),
                    phone: '123456789',
                }),
            )

            const resolved = await resolvePeer(client, '+123456789')

            expect(resolved).toEqual({
                _: 'inputPeerUser',
                userId: 123,
                accessHash: Long.fromBits(456, 789),
            })
        })

        it('should call contacts.resolvePhone if not in storage', async () => {
            const client = new StubTelegramClient()

            const resolvePhoneFn = client.respondWith(
                'contacts.resolvePhone',
                vi.fn().mockReturnValue({
                    _: 'contacts.resolvedPeer',
                    peer: {
                        _: 'peerUser',
                        userId: 123,
                    },
                    users: [
                        createStub('user', {
                            id: 123,
                            accessHash: Long.fromBits(456, 789),
                        }),
                    ],
                }),
            )

            const resolved = await resolvePeer(client, '+123456789')

            expect(resolved).toEqual({
                _: 'inputPeerUser',
                userId: 123,
                accessHash: Long.fromBits(456, 789),
            })
            expect(resolvePhoneFn).toHaveBeenCalledWith({
                _: 'contacts.resolvePhone',
                phone: '123456789',
            })
        })

        it('should handle empty response from contacts.resolvePhone', async () => {
            const client = new StubTelegramClient()

            const resolvePhoneFn = vi.fn().mockReturnValue({
                _: 'contacts.resolvedPeer',
                peer: {
                    _: 'peerUser',
                    userId: 123,
                },
                users: [],
            })
            client.respondWith('contacts.resolvePhone', resolvePhoneFn)

            await expect(() => resolvePeer(client, '+123456789')).rejects.toThrow(MtPeerNotFoundError)
        })
    })

    describe('resolving by username', () => {
        it('should first try checking in storage', async () => {
            const client = StubTelegramClient.offline()

            await client.registerPeers(
                createStub('user', {
                    id: 123,
                    accessHash: Long.fromBits(456, 789),
                    username: 'test',
                }),
            )

            const resolved = await resolvePeer(client, 'test')

            expect(resolved).toEqual({
                _: 'inputPeerUser',
                userId: 123,
                accessHash: Long.fromBits(456, 789),
            })
        })

        it('should call contacts.resolveUsername if not in storage', async () => {
            const client = new StubTelegramClient()

            const resolveUsernameFn = vi.fn().mockReturnValue({
                _: 'contacts.resolvedPeer',
                peer: {
                    _: 'peerChannel',
                    channelId: 123,
                },
                chats: [
                    createStub('channel', {
                        id: 123,
                        accessHash: Long.fromBits(456, 789),
                    }),
                ],
            })
            client.respondWith('contacts.resolveUsername', resolveUsernameFn)

            const resolved = await resolvePeer(client, 'test')

            expect(resolved).toEqual({
                _: 'inputPeerChannel',
                channelId: 123,
                accessHash: Long.fromBits(456, 789),
            })
            expect(resolveUsernameFn).toHaveBeenCalledWith({
                _: 'contacts.resolveUsername',
                username: 'test',
            })
        })

        it('should handle empty response from contacts.resolveUsername', async () => {
            const client = new StubTelegramClient()

            const resolveUsernameFn = vi.fn().mockReturnValue({
                _: 'contacts.resolvedPeer',
                peer: {
                    _: 'peerChannel',
                    channelId: 123,
                },
                chats: [],
            })
            client.respondWith('contacts.resolveUsername', resolveUsernameFn)

            await expect(() => resolvePeer(client, 'test')).rejects.toThrow(MtPeerNotFoundError)
        })
    })
})
