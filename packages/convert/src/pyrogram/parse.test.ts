import { describe, expect, it } from 'vitest'
import { getPlatform } from '@mtcute/core/platform.js'

import { PYROGRAM_TEST_SESSION } from './__fixtures__/session.js'
import { PYROGRAM_TEST_SESSION_OLD } from './__fixtures__/session_old.js'
import { parsePyrogramSession } from './parse.js'

describe('pyrogram/parse', () => {
    it('should correctly parse old sessions', () => {
        expect(parsePyrogramSession(PYROGRAM_TEST_SESSION_OLD)).toEqual({
            isBot: false,
            isTest: true,
            userId: 5000801609,
            dcId: 2,
            authKey: getPlatform().hexDecode(
                '1674732db80d690b4d5890d887a4bd5b0b4c810b7c331990b049158a940fdaeb'
                + 'd46178f50ddcce753699f0497ad6de9655f454bc5a3030524036dee4ffe3db7c'
                + '73b526c378a184a0fafa14e9679c170b632e0b412c174f99e96b216214f78263'
                + '7a42112dd23957a39716d41277318997b6c4d635ffe125f777ff017f6456b9f2'
                + '7b5557edea774f304118622ff23133b2f961ace33f0d1d836cfdd82a9101192e'
                + 'fe8ab90f6f55e96e9ba3c4fe48bcc5fee8e3e5970040bdb9989b427177e1863a'
                + '7d6adc5caea9cacc4b34e71cab7a19e52592a81a69d7d261763ffeb0507a990b'
                + 'db5c4c1515e0098571bbb2ee6ff84982e727c31b7ed36ceda5871cd701d51e1f',
            ),
        })
    })

    it('should correctly parse new sessions', () => {
        expect(parsePyrogramSession(PYROGRAM_TEST_SESSION)).toEqual({
            apiId: 3328759,
            isBot: false,
            isTest: true,
            userId: 5000801609,
            dcId: 2,
            authKey: getPlatform().hexDecode(
                '4e4e8ab2caa290a3f1121c5f5c9a64a0522043fa3c5690a4ff8834b5c1ded2b5'
                + '425f1df801a0cabda34e95b909399e23037008f220d8908da8a6e89f6ccffb4b'
                + '6bbd30c767ae37e0e63a5f9177c8f7ec05f032bf5011887b5ce4fc86e7d081cb'
                + '473fa591bf90a9936187c3bc1a06fc72279a99ab446302eb92391947b246e77a'
                + 'bbe85d24b54776d8bebf6d4969f69fea817a8183cbd9764208b3d4f53a24a1c3'
                + '65fa4cd3b4958a9f25569cccc550713f59b74162cab00ca68bc5b93efef7a385'
                + '296710f60cebb3f4877f3f47ad0801c2f3527645738974edc4b257b1a373dec9'
                + '867b287e084b8481d1777a72040a7cdfb65bef50294b37fca570f8abd5b8b8ff',
            ),
        })
    })
})
