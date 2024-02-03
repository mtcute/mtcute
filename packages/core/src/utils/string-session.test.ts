import { describe, expect, it } from 'vitest'

import { createStub } from '@mtcute/test'
import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlWriterMap } from '@mtcute/tl/binary/writer.js'

import { defaultProductionDc } from './dcs.js'
import { readStringSession, writeStringSession } from './string-session.js'

const stubAuthKey = new Uint8Array(32)
const stubDcs = {
    main: createStub('dcOption', defaultProductionDc.main),
    media: createStub('dcOption', defaultProductionDc.media),
}
const stubDcsSameMedia = {
    main: stubDcs.main,
    media: stubDcs.main,
}

describe('writeStringSession', () => {
    it('should write production string session without user', () => {
        expect(
            writeStringSession(__tlWriterMap, {
                version: 2,
                testMode: false,
                primaryDcs: stubDcs,
                authKey: stubAuthKey,
            }),
        ).toMatchInlineSnapshot(
            '"AgQAAAANobcYAAAAAAIAAAAOMTQ5LjE1NC4xNjcuNTAAuwEAAA2htxgCAAAAAgAAAA8xNDkuMTU0LjE2Ny4yMjK7AQAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
        )
    })
    it('should write production string session without user with same dc for media', () => {
        expect(
            writeStringSession(__tlWriterMap, {
                version: 2,
                testMode: false,
                primaryDcs: stubDcsSameMedia,
                authKey: stubAuthKey,
            }),
        ).toMatchInlineSnapshot(
            '"AgAAAAANobcYAAAAAAIAAAAOMTQ5LjE1NC4xNjcuNTAAuwEAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
        )
    })

    it('should write production string session with user', () => {
        expect(
            writeStringSession(__tlWriterMap, {
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
            }),
        ).toMatchInlineSnapshot(
            '"AgUAAAANobcYAAAAAAIAAAAOMTQ5LjE1NC4xNjcuNTAAuwEAAA2htxgCAAAAAgAAAA8xNDkuMTU0LjE2Ny4yMjK7AQAAOTAAAAAAAAA3l3m8IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
        )
    })

    it('should write test dc string session with user', () => {
        expect(
            writeStringSession(__tlWriterMap, {
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
            }),
        ).toMatchInlineSnapshot(
            '"AgcAAAANobcYAAAAAAIAAAAOMTQ5LjE1NC4xNjcuNTAAuwEAAA2htxgCAAAAAgAAAA8xNDkuMTU0LjE2Ny4yMjK7AQAAOTAAAAAAAAA3l3m8IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
        )
    })
})

describe('readStringSession', () => {
    describe('v2', () => {
        it('should read production string session without user', () => {
            expect(
                readStringSession(
                    __tlReaderMap,
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
                    __tlReaderMap,
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
                    __tlReaderMap,
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
                    __tlReaderMap,
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
                    __tlReaderMap,
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
