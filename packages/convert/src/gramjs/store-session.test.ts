import type { INodeFsLike } from '../utils/fs.js'

import { utf8 } from '@fuman/utils'
import { describe, expect, it } from 'vitest'
import { readGramjsStoreSession, writeGramjsStoreSession } from './store-session.js'

class FakeFs implements INodeFsLike {
    readonly files = new Map<string, Uint8Array>()

    async readFile(path: string): Promise<Uint8Array> {
        return this.files.get(path)!
    }

    async writeFile(path: string, data: Uint8Array): Promise<void> {
        this.files.set(path, data)
    }

    async stat(path: string): Promise<{ size: number, lastModified: number }> {
        return {
            size: this.files.get(path)!.length,
            lastModified: 0,
        }
    }

    mkdir(): Promise<void> {
        return Promise.resolve()
    }
}
if (import.meta.env.TEST_ENV === 'node') {
    const { fileURLToPath } = await import('node:url')
    describe('gramjs/store-session', () => {
        it('should read a store session', async () => {
            const session = await readGramjsStoreSession(fileURLToPath(new URL('./__fixtures__/store-session', import.meta.url)))

            expect(session.dcId).toEqual(2)
            expect(session.ipAddress).toEqual('149.154.167.40')
            expect(session.port).toEqual(443)
            expect(session.authKey).toEqual(new Uint8Array([
                156,
                240,
                152,
                12,
                46,
                136,
                38,
                237,
                213,
                214,
                192,
                122,
                108,
                230,
                66,
                244,
                49,
                200,
                68,
                242,
                109,
                206,
                230,
                165,
                182,
                159,
                225,
                6,
                77,
                106,
                146,
                60,
                184,
                228,
                145,
                212,
                239,
                139,
                22,
                136,
                144,
                184,
                37,
                123,
                62,
                50,
                144,
                80,
                51,
                133,
                165,
                162,
                88,
                230,
                238,
                143,
                26,
                39,
                117,
                31,
                244,
                134,
                171,
                121,
                55,
                155,
                111,
                192,
                205,
                155,
                10,
                210,
                82,
                81,
                73,
                165,
                100,
                72,
                239,
                107,
                68,
                72,
                203,
                144,
                114,
                48,
                255,
                8,
                193,
                120,
                166,
                146,
                118,
                151,
                40,
                86,
                10,
                224,
                185,
                174,
                164,
                214,
                65,
                21,
                226,
                184,
                32,
                13,
                117,
                193,
                139,
                133,
                76,
                160,
                248,
                110,
                144,
                103,
                223,
                165,
                135,
                174,
                50,
                87,
                88,
                69,
                58,
                132,
                186,
                29,
                74,
                163,
                164,
                37,
                121,
                156,
                245,
                112,
                80,
                64,
                186,
                120,
                171,
                165,
                166,
                158,
                139,
                55,
                25,
                255,
                18,
                206,
                158,
                156,
                146,
                13,
                132,
                143,
                151,
                37,
                198,
                17,
                127,
                107,
                232,
                213,
                145,
                98,
                160,
                160,
                99,
                32,
                148,
                67,
                2,
                157,
                55,
                120,
                153,
                126,
                39,
                252,
                162,
                121,
                5,
                2,
                128,
                118,
                157,
                206,
                248,
                78,
                61,
                11,
                209,
                21,
                64,
                100,
                217,
                181,
                85,
                38,
                98,
                249,
                48,
                95,
                15,
                132,
                62,
                111,
                57,
                248,
                145,
                178,
                78,
                222,
                238,
                57,
                17,
                230,
                129,
                129,
                132,
                249,
                17,
                34,
                95,
                237,
                235,
                153,
                202,
                62,
                147,
                35,
                130,
                88,
                23,
                1,
                150,
                81,
                59,
                212,
                153,
                167,
                240,
                252,
                58,
                135,
                15,
                52,
                249,
                252,
                23,
                82,
                175,
                184,
            ]))
        })

        it('should write a store session', async () => {
            const fs = new FakeFs()

            await writeGramjsStoreSession(fileURLToPath(new URL('/store-session', import.meta.url)), {
                dcId: 2,
                ipAddress: '149.154.167.40',
                ipv6: false,
                port: 443,
                authKey: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
            }, { fs })

            expect(Object.fromEntries(fs.files)).toEqual({
                '/store-session/store-session%3AauthKey': utf8.encoder.encode(JSON.stringify({
                    type: 'Buffer',
                    data: [1, 2, 3, 4, 5, 6, 7, 8],
                })),
                '/store-session/store-session%3AdcId': utf8.encoder.encode('2'),
                '/store-session/store-session%3AserverAddress': utf8.encoder.encode(JSON.stringify('149.154.167.40')),
                '/store-session/store-session%3Aport': utf8.encoder.encode('443'),
            })
        })
    })
} else {
    describe.skip('gramjs/store-session', () => {})
}