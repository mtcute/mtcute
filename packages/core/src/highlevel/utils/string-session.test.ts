import { describe, expect, it } from 'vitest'

import { __tlWriterMap } from '@mtcute/tl/binary/writer.js'

import { defaultProductionDc } from '../../utils/dcs.js'
import { readStringSession, writeStringSession } from './string-session.js'

const stubAuthKey = new Uint8Array(32)
const stubDcs = {
    main: {
        ...defaultProductionDc.main,
        ipv6: false,
        mediaOnly: false,
    },
    media: {
        ...defaultProductionDc.media,
        ipv6: false,
        mediaOnly: true,
    },
}
const stubDcsBasic = {
    main: {
        id: 2,
        ipAddress: defaultProductionDc.main.ipAddress,
        ipv6: false,
        mediaOnly: false,
        port: 443,
    },
    media: {
        id: 2,
        ipAddress: defaultProductionDc.media.ipAddress,
        ipv6: false,
        mediaOnly: true,
        port: 443,
    },
}
const stubDcsSameMedia = {
    main: stubDcs.main,
    media: stubDcs.main,
}
const stubDcsBasicSameMedia = {
    main: stubDcsBasic.main,
    media: stubDcsBasic.main,
}

describe('writeStringSession', () => {
    it('should write production string session without user', () => {
        expect(
            writeStringSession({
                version: 3,
                testMode: false,
                primaryDcs: stubDcsBasic,
                authKey: stubAuthKey,
            }),
        ).toMatchInlineSnapshot(
            '"AwQAAAAXAQIADjE0OS4xNTQuMTY3LjUwALsBAAAXAQICDzE0OS4xNTQuMTY3LjIyMrsBAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
        )
    })
    it('should write production string session without user with same dc for media', () => {
        expect(
            writeStringSession({
                version: 3,
                testMode: false,
                primaryDcs: stubDcsBasicSameMedia,
                authKey: stubAuthKey,
            }),
        ).toMatchInlineSnapshot(
            '"AwAAAAAXAQIADjE0OS4xNTQuMTY3LjUwALsBAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
        )
    })

    it('should write production string session with user', () => {
        expect(
            writeStringSession({
                version: 3,
                testMode: false,
                primaryDcs: stubDcsBasic,
                authKey: stubAuthKey,
                self: {
                    userId: 12345,
                    isBot: false,
                    isPremium: false,
                    usernames: [],
                },
            }),
        ).toMatchInlineSnapshot(
            '"AwUAAAAXAQIADjE0OS4xNTQuMTY3LjUwALsBAAAXAQICDzE0OS4xNTQuMTY3LjIyMrsBAAA5MAAAAAAAADeXebwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
        )
    })

    it('should write test dc string session with user', () => {
        expect(
            writeStringSession({
                version: 3,
                testMode: true,
                primaryDcs: stubDcsBasic,
                authKey: stubAuthKey,
                self: {
                    userId: 12345,
                    isBot: false,
                    isPremium: false,
                    usernames: [],
                },
            }),
        ).toMatchInlineSnapshot(
            '"AwcAAAAXAQIADjE0OS4xNTQuMTY3LjUwALsBAAAXAQICDzE0OS4xNTQuMTY3LjIyMrsBAAA5MAAAAAAAADeXebwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
        )
    })
})

describe('readStringSession', () => {
    describe('v3', () => {
        it('should read production string session without user', () => {
            expect(
                readStringSession(
                    'AwQAAAAXAQIADjE0OS4xNTQuMTY3LjUwALsBAAAXAQICDzE0OS4xNTQuMTY3LjIyMrsBAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ),
            ).toEqual({
                version: 3,
                testMode: false,
                primaryDcs: stubDcsBasic,
                authKey: stubAuthKey,
                self: null,
            })
        })

        it('should read production string session without user with same dc for media', () => {
            expect(
                readStringSession(
                    'AwAAAAAXAQIADjE0OS4xNTQuMTY3LjUwALsBAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ),
            ).toEqual({
                version: 3,
                testMode: false,
                primaryDcs: stubDcsBasicSameMedia,
                authKey: stubAuthKey,
                self: null,
            })
        })

        it('should read production string session with user', () => {
            expect(
                readStringSession(
                    'AwUAAAAXAQIADjE0OS4xNTQuMTY3LjUwALsBAAAXAQICDzE0OS4xNTQuMTY3LjIyMrsBAAA5MAAAAAAAADeXebwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ),
            ).toEqual({
                version: 3,
                testMode: false,
                primaryDcs: stubDcsBasic,
                authKey: stubAuthKey,
                self: {
                    userId: 12345,
                    isBot: false,
                    isPremium: false,
                    usernames: [],
                },
            })
        })

        it('should read test dc string session with user', () => {
            expect(
                readStringSession(
                    'AwcAAAAXAQIADjE0OS4xNTQuMTY3LjUwALsBAAAXAQICDzE0OS4xNTQuMTY3LjIyMrsBAAA5MAAAAAAAADeXebwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ),
            ).toEqual({
                version: 3,
                testMode: true,
                primaryDcs: stubDcsBasic,
                authKey: stubAuthKey,
                self: {
                    userId: 12345,
                    isBot: false,
                    isPremium: false,
                    usernames: [],
                },
            })
        })
    })

    describe('v2', () => {
        it('should read production string session without user', () => {
            expect(
                readStringSession(
                    'AgQAAAANobcYAAAAAAIAAAAOMTQ5LjE1NC4xNjcuNTAAuwEAAA2htxgCAAAAAgAAAA8xNDkuMTU0LjE2Ny4yMjK7AQAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ),
            ).toEqual({
                version: 2,
                testMode: false,
                primaryDcs: stubDcs,
                authKey: stubAuthKey,
                self: null,
            })
        })

        it('should read production string session without user with same dc for media', () => {
            expect(
                readStringSession(
                    'AgAAAAANobcYAAAAAAIAAAAOMTQ5LjE1NC4xNjcuNTAAuwEAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ),
            ).toEqual({
                version: 2,
                testMode: false,
                primaryDcs: stubDcsSameMedia,
                authKey: stubAuthKey,
                self: null,
            })
        })

        it('should read production string session with user', () => {
            expect(
                readStringSession(
                    'AgUAAAANobcYAAAAAAIAAAAOMTQ5LjE1NC4xNjcuNTAAuwEAAA2htxgCAAAAAgAAAA8xNDkuMTU0LjE2Ny4yMjK7AQAAOTAAAAAAAAA3l3m8IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ),
            ).toEqual({
                version: 2,
                testMode: false,
                primaryDcs: stubDcs,
                authKey: stubAuthKey,
                self: {
                    userId: 12345,
                    isBot: false,
                    isPremium: false,
                    usernames: [],
                },
            })
        })

        it('should read test dc string session with user', () => {
            expect(
                readStringSession(
                    'AgcAAAANobcYAAAAAAIAAAAOMTQ5LjE1NC4xNjcuNTAAuwEAAA2htxgCAAAAAgAAAA8xNDkuMTU0LjE2Ny4yMjK7AQAAOTAAAAAAAAA3l3m8IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ),
            ).toEqual({
                version: 2,
                testMode: true,
                primaryDcs: stubDcs,
                authKey: stubAuthKey,
                self: {
                    userId: 12345,
                    isBot: false,
                    isPremium: false,
                    usernames: [],
                },
            })
        })
    })

    describe('v1', () => {
        it('should read string session with user', () => {
            expect(
                readStringSession(
                    'AQEAAAANobcYAAAAAAIAAAAOMTQ5LjE1NC4xNjcuNTAAuwEAADkwAAAAAAAAN5d5vCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                ),
            ).toEqual({
                version: 1,
                testMode: false,
                // v1 didn't have separate media dc
                primaryDcs: stubDcsSameMedia,
                authKey: stubAuthKey,
                self: {
                    userId: 12345,
                    isBot: false,
                    isPremium: false,
                    usernames: [],
                },
            })
        })
    })
})
