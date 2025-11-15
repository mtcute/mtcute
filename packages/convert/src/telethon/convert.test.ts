import { hex } from '@fuman/utils'
import { describe, expect, it } from 'vitest'

import { TELETHON_TEST_SESSION } from './__fixtures__/session.js'
import { convertFromTelethonSession, convertToTelethonSession } from './convert.js'

describe('telethon/convert', () => {
  it('should correctly convert from telethon sessions', () => {
    expect(convertFromTelethonSession(TELETHON_TEST_SESSION)).toEqual({
      authKey: hex.decode(
        '28494b5ff1c142b4d48b3870ebd06b524a4e7d4f39a6dd31409f2e65cd605532'
        + 'bc6deff59fea6c5345a77cd83fefb7695a53608d83a41d886f8ea9fdbc120b48'
        + 'f54048ef750c498f6e9c563f0d7ec96b0a462b755de094e85d7334aad3c929df'
        + '57aa0465cc3e103bc32ec339c48b2c0a32f897f743f57f437cb66bcffae00ac5'
        + '25ef0f15f4aa91d3b9e9542eb5a8cd2ec70552d4d05d44052c9edfb7abc897ff'
        + 'd439cf6da506448855bb8d69880fbf5691f60b1c58ee0a14d528630b0daf1871'
        + '98facf94aafa95cf13d55b01b2792f5251a9739ecb7406b59809788130c3f596'
        + '0f99cc3147e12c8c9d0f68bb783995a1413910864fa6c7af2668e218bc38bc99',
      ),
      primaryDcs: {
        main: {
          id: 2,
          ipAddress: '149.154.167.40',
          ipv6: false,
          port: 80,
          testMode: true,
        },
        media: {
          id: 2,
          ipAddress: '149.154.167.40',
          ipv6: false,
          port: 80,
          testMode: true,
        },
      },
      version: 3,
    })
  })

  it('should correctly convert to telethon sessions', () => {
    expect(
      convertToTelethonSession({
        authKey: hex.decode(
          '28494b5ff1c142b4d48b3870ebd06b524a4e7d4f39a6dd31409f2e65cd605532'
          + 'bc6deff59fea6c5345a77cd83fefb7695a53608d83a41d886f8ea9fdbc120b48'
          + 'f54048ef750c498f6e9c563f0d7ec96b0a462b755de094e85d7334aad3c929df'
          + '57aa0465cc3e103bc32ec339c48b2c0a32f897f743f57f437cb66bcffae00ac5'
          + '25ef0f15f4aa91d3b9e9542eb5a8cd2ec70552d4d05d44052c9edfb7abc897ff'
          + 'd439cf6da506448855bb8d69880fbf5691f60b1c58ee0a14d528630b0daf1871'
          + '98facf94aafa95cf13d55b01b2792f5251a9739ecb7406b59809788130c3f596'
          + '0f99cc3147e12c8c9d0f68bb783995a1413910864fa6c7af2668e218bc38bc99',
        ),
        primaryDcs: {
          main: {
            id: 2,
            ipAddress: '149.154.167.40',
            ipv6: false,
            port: 80,
            testMode: true,
          },
          media: {
            id: 2,
            ipAddress: '149.154.167.40',
            ipv6: false,
            port: 80,
            testMode: true,
          },
        },
        version: 3,
      }),
    ).toEqual(TELETHON_TEST_SESSION)
  })
})
