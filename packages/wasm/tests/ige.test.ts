import { hex } from '@fuman/utils'
import { beforeAll, describe, expect, it } from 'vitest'

import { __getWasm, ige256Decrypt, ige256Encrypt } from '../src/index.js'

import { initWasm } from './init.js'

beforeAll(async () => {
  await initWasm()
})

describe('aes-ige', () => {
  const key = hex.decode('5468697320697320616E20696D706C655468697320697320616E20696D706C65')
  const iv = hex.decode('6D656E746174696F6E206F6620494745206D6F646520666F72204F70656E5353')

  const data = hex.decode('99706487a1cde613bc6de0b6f24b1c7aa448c8b9c3403e3467a8cad89340f53b')
  const dataEnc = hex.decode('792ea8ae577b1a66cb3bd92679b8030ca54ee631976bd3a04547fdcb4639fa69')

  it('should correctly encrypt', () => {
    const aes = ige256Encrypt(data, key, iv)

    expect(hex.encode(aes)).toEqual(hex.encode(dataEnc))
  })

  it('should correctly decrypt', () => {
    const aes = ige256Decrypt(dataEnc, key, iv)

    expect(hex.encode(aes)).toEqual(hex.encode(data))
  })

  it('should not leak memory', () => {
    const mem = __getWasm().memory.buffer
    const memSize = mem.byteLength

    for (let i = 0; i < 10000; i++) {
      ige256Decrypt(ige256Encrypt(data, key, iv), key, iv)
    }

    expect(mem.byteLength).toEqual(memSize)
  })
})
