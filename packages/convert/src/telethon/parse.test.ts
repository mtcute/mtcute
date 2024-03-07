import { describe, expect, it } from 'vitest'

import { getPlatform } from '@mtcute/core/platform.js'

import { TELETHON_TEST_SESSION } from './__fixtures__/session.js'
import { TELETHON_TEST_SESSION_V6 } from './__fixtures__/session_v6.js'
import { parseTelethonSession } from './parse.js'

describe('telethon/parse', () => {
    it('should correctly parse ipv4 sessions', () => {
        expect(parseTelethonSession(TELETHON_TEST_SESSION)).toEqual({
            dcId: 2,
            ipAddress: '149.154.167.40',
            port: 80,
            ipv6: false,
            authKey: getPlatform().hexDecode(
                '28494b5ff1c142b4d48b3870ebd06b524a4e7d4f39a6dd31409f2e65cd605532' +
                    'bc6deff59fea6c5345a77cd83fefb7695a53608d83a41d886f8ea9fdbc120b48' +
                    'f54048ef750c498f6e9c563f0d7ec96b0a462b755de094e85d7334aad3c929df' +
                    '57aa0465cc3e103bc32ec339c48b2c0a32f897f743f57f437cb66bcffae00ac5' +
                    '25ef0f15f4aa91d3b9e9542eb5a8cd2ec70552d4d05d44052c9edfb7abc897ff' +
                    'd439cf6da506448855bb8d69880fbf5691f60b1c58ee0a14d528630b0daf1871' +
                    '98facf94aafa95cf13d55b01b2792f5251a9739ecb7406b59809788130c3f596' +
                    '0f99cc3147e12c8c9d0f68bb783995a1413910864fa6c7af2668e218bc38bc99',
            ),
        })
    })

    it('should correctly parse ipv6 sessions', () => {
        expect(parseTelethonSession(TELETHON_TEST_SESSION_V6)).toEqual({
            dcId: 1,
            ipAddress: '2001:0b28:f23d:f001:0000:0000:0000:000e',
            port: 443,
            ipv6: true,
            authKey: getPlatform().hexDecode(
                '8a6f780156484e75fedacab2b45078cbc65cc97c7c8e8db06696a9dad75deab2' +
                    '6979def6a36d86a9eb0661f9ea41df3a115408f4a857334dac682742bebb0184' +
                    '1b921a4ffd89a5d840ddf1ea5d73a1b2c21e2ad8d0606325ba5414fc50a83cf7' +
                    'e15e6d84ceea7e3b235709306b1267575dc443a92291d7b1298f7460524f3eae' +
                    '6876cb628d239f1779f4f427e07e1d29bf05c6e390b1455adef63fa3bf473153' +
                    '104554f5224b142858398007b9649d32c7a5b8a4cbe255b0be4d8642d072279a' +
                    'fd9f14cbfe4b7ad0ca0d42eeaa54f866e8d4fe94642e0a6469aeda9309a2814d' +
                    'c9f45b160977048e59f85371f532aee1416b17d1ba43497c3e33d73999b88fe7',
            ),
        })
    })
})
