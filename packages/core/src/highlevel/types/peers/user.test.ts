import Long from 'long'
import { describe, expect, it } from 'vitest'

import { createStub } from '@mtcute/test'

import { MessageEntity } from '../messages/index.js'
import { User } from './user.js'

describe('User', () => {
    describe('inputPeer', () => {
        it('should return correct input peer', () => {
            const user = new User(
                createStub('user', {
                    id: 123,
                    accessHash: Long.fromBits(456, 789),
                }),
            )

            expect(user.inputPeer).toEqual({
                _: 'inputPeerUser',
                userId: 123,
                accessHash: Long.fromBits(456, 789),
            })
        })

        it('should throw if user has no access hash', () => {
            const user = new User(
                createStub('user', {
                    id: 123,
                    accessHash: undefined,
                }),
            )

            expect(() => user.inputPeer).toThrow()
        })

        it('should return correct input peer for min', () => {
            const user = new User(
                createStub('user', {
                    id: 123,
                    accessHash: Long.fromBits(456, 789),
                    min: true,
                }),
            )

            expect(user.inputPeer).toEqual({
                _: 'mtcute.dummyInputPeerMinUser',
                userId: 123,
            })
        })
    })

    describe('status', () => {
        it('should correctly handle bot online status', () => {
            const user = new User(
                createStub('user', {
                    bot: true,
                }),
            )

            expect(user.status).toEqual('bot')
            expect(user.lastOnline).toBeNull()
            expect(user.nextOffline).toBeNull()
        })

        it('should correctly handle online status', () => {
            const user = new User(
                createStub('user', {
                    status: {
                        _: 'userStatusOnline',
                        expires: 1000,
                    },
                }),
            )

            expect(user.status).toEqual('online')
            expect(user.lastOnline).toBeNull()
            expect(user.nextOffline).toEqual(new Date(1000_000))
        })

        it('should correctly handle offline status', () => {
            const user = new User(
                createStub('user', {
                    status: {
                        _: 'userStatusOffline',
                        wasOnline: 1000,
                    },
                }),
            )

            expect(user.status).toEqual('offline')
            expect(user.lastOnline).toEqual(new Date(1000_000))
            expect(user.nextOffline).toBeNull()
        })

        it.each([
            ['userStatusRecently', 'recently'],
            ['userStatusLastWeek', 'within_week'],
            ['userStatusLastMonth', 'within_month'],
            ['userStatusEmpty', 'long_time_ago'],
        ] as const)('should correctly handle %s status', (status, expected) => {
            const user = new User(
                createStub('user', {
                    status: {
                        _: status,
                    },
                }),
            )

            expect(user.status).toEqual(expected)
            expect(user.lastOnline).toBeNull()
            expect(user.nextOffline).toBeNull()
        })
    })

    describe('usernames', () => {
        it('should handle users with one username', () => {
            const user = new User(
                createStub('user', {
                    username: 'test',
                }),
            )

            expect(user.username).toEqual('test')
            expect(user.usernames).toEqual([{ _: 'username', username: 'test', active: true }])
        })

        it('should handle users with multiple usernames', () => {
            const user = new User(
                createStub('user', {
                    usernames: [
                        { _: 'username', username: 'test', active: true },
                        { _: 'username', username: 'test2', active: false },
                    ],
                }),
            )

            expect(user.username).toEqual('test')
            expect(user.usernames).toEqual([
                { _: 'username', username: 'test', active: true },
                { _: 'username', username: 'test2', active: false },
            ])
        })

        it('should handle users with both username and usernames', () => {
            // according to docs, this shouldn't ever actually happen,
            // but just in case. let's just ignore the usernames field
            const user = new User(
                createStub('user', {
                    username: 'test1',
                    usernames: [
                        { _: 'username', username: 'test2', active: true },
                        { _: 'username', username: 'test3', active: false },
                    ],
                }),
            )

            expect(user.username).toEqual('test1')
            expect(user.usernames).toEqual([{ _: 'username', username: 'test1', active: true }])
        })
    })

    describe('displayName', () => {
        it('should work for users without first name', () => {
            const user = new User(
                createStub('user', {
                    firstName: undefined,
                }),
            )

            expect(user.displayName).toEqual('Deleted Account')
        })

        it('should work for users with only first name', () => {
            const user = new User(
                createStub('user', {
                    firstName: 'John',
                }),
            )

            expect(user.displayName).toEqual('John')
        })

        it('should work for users with first and last name', () => {
            const user = new User(
                createStub('user', {
                    firstName: 'John',
                    lastName: 'Doe',
                }),
            )

            expect(user.displayName).toEqual('John Doe')
        })
    })

    describe('mention', () => {
        it('should work for users with a username', () => {
            const user = new User(
                createStub('user', {
                    username: 'test',
                }),
            )

            expect(user.mention()).toEqual('@test')
        })

        it('should work for users with multiple usernames', () => {
            const user = new User(
                createStub('user', {
                    usernames: [
                        { _: 'username', username: 'test', active: true },
                        { _: 'username', username: 'test2', active: false },
                    ],
                }),
            )

            expect(user.mention()).toEqual('@test')
        })

        it('should work for users without a username', () => {
            const user = new User(
                createStub('user', {
                    firstName: 'John',
                    lastName: 'Doe',
                }),
            )

            expect(user.mention()).toEqual(
                new MessageEntity(
                    {
                        _: 'messageEntityMentionName',
                        userId: user.id,
                        offset: 0,
                        length: 8,
                    },
                    'John Doe',
                ),
            )
        })
    })
})
