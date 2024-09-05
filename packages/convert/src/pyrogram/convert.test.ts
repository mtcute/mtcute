import { describe, expect, it } from 'vitest'
import { hex } from '@fuman/utils'

import { PYROGRAM_TEST_SESSION_OLD } from './__fixtures__/session_old.js'
import { convertFromPyrogramSession, convertToPyrogramSession } from './convert.js'

describe('pyrogram/convert', () => {
    it('should correctly convert from pyrogram sessions', () => {
        expect(convertFromPyrogramSession(PYROGRAM_TEST_SESSION_OLD)).toEqual({
            authKey: hex.decode(
                '1674732db80d690b4d5890d887a4bd5b0b4c810b7c331990b049158a940fdaeb'
                + 'd46178f50ddcce753699f0497ad6de9655f454bc5a3030524036dee4ffe3db7c'
                + '73b526c378a184a0fafa14e9679c170b632e0b412c174f99e96b216214f78263'
                + '7a42112dd23957a39716d41277318997b6c4d635ffe125f777ff017f6456b9f2'
                + '7b5557edea774f304118622ff23133b2f961ace33f0d1d836cfdd82a9101192e'
                + 'fe8ab90f6f55e96e9ba3c4fe48bcc5fee8e3e5970040bdb9989b427177e1863a'
                + '7d6adc5caea9cacc4b34e71cab7a19e52592a81a69d7d261763ffeb0507a990b'
                + 'db5c4c1515e0098571bbb2ee6ff84982e727c31b7ed36ceda5871cd701d51e1f',
            ),
            primaryDcs: {
                main: {
                    id: 2,
                    ipAddress: '149.154.167.40',
                    port: 443,
                },
                media: {
                    id: 2,
                    ipAddress: '149.154.167.40',
                    port: 443,
                },
            },
            self: {
                isBot: false,
                isPremium: false,
                userId: 5000801609,
                usernames: [],
            },
            testMode: true,
            version: 3,
        })
    })

    it('should correctly convert to pyrogram sessions', () => {
        expect(
            convertToPyrogramSession({
                authKey: hex.decode(
                    '1674732db80d690b4d5890d887a4bd5b0b4c810b7c331990b049158a940fdaeb'
                    + 'd46178f50ddcce753699f0497ad6de9655f454bc5a3030524036dee4ffe3db7c'
                    + '73b526c378a184a0fafa14e9679c170b632e0b412c174f99e96b216214f78263'
                    + '7a42112dd23957a39716d41277318997b6c4d635ffe125f777ff017f6456b9f2'
                    + '7b5557edea774f304118622ff23133b2f961ace33f0d1d836cfdd82a9101192e'
                    + 'fe8ab90f6f55e96e9ba3c4fe48bcc5fee8e3e5970040bdb9989b427177e1863a'
                    + '7d6adc5caea9cacc4b34e71cab7a19e52592a81a69d7d261763ffeb0507a990b'
                    + 'db5c4c1515e0098571bbb2ee6ff84982e727c31b7ed36ceda5871cd701d51e1f',
                ),
                primaryDcs: {
                    main: {
                        id: 2,
                        ipAddress: '149.154.167.40',
                        port: 443,
                        testMode: true,
                    },
                    media: {
                        id: 2,
                        ipAddress: '149.154.167.40',
                        port: 443,
                        testMode: true,
                    },
                },
                self: {
                    isBot: false,
                    isPremium: false,
                    userId: 5000801609,
                    usernames: [],
                },
                version: 3,
            }),
        ).toEqual(PYROGRAM_TEST_SESSION_OLD)
    })
})
