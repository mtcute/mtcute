import { describe, expect, it } from 'vitest'

import { defaultProductionDc } from '../../utils/dcs.js'

import { readStringSession, writeStringSession } from './string-session.js'

const stubAuthKey = new Uint8Array(32)
const stubDcsBasic = {
    main: {
        id: 2,
        ipAddress: defaultProductionDc.main.ipAddress,
        ipv6: false,
        mediaOnly: false,
        port: 443,
        testMode: false,
    },
    media: {
        id: 2,
        ipAddress: defaultProductionDc.media.ipAddress,
        ipv6: false,
        mediaOnly: true,
        port: 443,
        testMode: false,
    },
}
const stubDcsBasicTest = {
    main: {
        ...stubDcsBasic.main,
        testMode: true,
    },
    media: {
        ...stubDcsBasic.media,
        testMode: true,
    },
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
                primaryDcs: stubDcsBasic,
                authKey: stubAuthKey,
            }),
        ).toMatchInlineSnapshot(
            '"AwQAAAAXAgIADjE0OS4xNTQuMTY3LjUwALsBAAAXAgICDzE0OS4xNTQuMTY3LjIyMrsBAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
        )
    })
    it('should write production string session without user with same dc for media', () => {
        expect(
            writeStringSession({
                version: 3,
                primaryDcs: stubDcsBasicSameMedia,
                authKey: stubAuthKey,
            }),
        ).toMatchInlineSnapshot(
            '"AwAAAAAXAgIADjE0OS4xNTQuMTY3LjUwALsBAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
        )
    })

    it('should write production string session with user', () => {
        expect(
            writeStringSession({
                version: 3,
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
            '"AwUAAAAXAgIADjE0OS4xNTQuMTY3LjUwALsBAAAXAgICDzE0OS4xNTQuMTY3LjIyMrsBAAA5MAAAAAAAADeXebwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
        )
    })

    it('should write test dc string session with user', () => {
        expect(
            writeStringSession({
                version: 3,
                primaryDcs: stubDcsBasicTest,
                authKey: stubAuthKey,
                self: {
                    userId: 12345,
                    isBot: false,
                    isPremium: false,
                    usernames: [],
                },
            }),
        ).toMatchInlineSnapshot(
            '"AwUAAAAXAgIEDjE0OS4xNTQuMTY3LjUwALsBAAAXAgIGDzE0OS4xNTQuMTY3LjIyMrsBAAA5MAAAAAAAADeXebwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
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
                primaryDcs: stubDcsBasicTest,
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
