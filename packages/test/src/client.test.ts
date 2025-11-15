import { hex } from '@fuman/utils'
import { describe, expect, it } from 'vitest'

import { StubTelegramClient } from './client.js'
import { createStub } from './stub.js'

describe('client stub', () => {
  it('should correctly intercept rpc calls', async () => {
    const client = new StubTelegramClient()

    const stubConfig = createStub('config')
    client.respondWith('help.getConfig', () => stubConfig)

    await client.with(async () => {
      const result = await client.call({ _: 'help.getConfig' })
      expect(result).toEqual(stubConfig)
    })
  })

  it('should correctly decrypt intercepted raw messages', async () => {
    const log: string[] = []

    const client = new StubTelegramClient({ logLevel: 5 })

    client.onRawMessage((msg) => {
      log.push(`message ctor=${hex.encode(msg.subarray(0, 4))}`)
      client.destroy().catch(console.error)
    })

    await client.with(async () => {
      await client.call({ _: 'help.getConfig' }).catch(console.error) // ignore "client closed" error

      expect(log[0]).to.be.oneOf([
        'message ctor=dcf8f173', // msg_container
        'message ctor=0d0d9bda', // invokeWithLayer
      ])
    })
  })
})
