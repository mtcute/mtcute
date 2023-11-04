/* eslint-disable no-restricted-globals */
import { expect } from 'chai'
import { before, describe } from 'mocha'

import { __getWasm, ige256Decrypt, ige256Encrypt, initAsync } from '../src/index.js'

before(async () => {
    await initAsync()
})

describe('aes-ige', () => {
    const key = Buffer.from('5468697320697320616E20696D706C655468697320697320616E20696D706C65', 'hex')
    const iv = Buffer.from('6D656E746174696F6E206F6620494745206D6F646520666F72204F70656E5353', 'hex')

    const data = Buffer.from('99706487a1cde613bc6de0b6f24b1c7aa448c8b9c3403e3467a8cad89340f53b', 'hex')
    const dataEnc = Buffer.from('792ea8ae577b1a66cb3bd92679b8030ca54ee631976bd3a04547fdcb4639fa69', 'hex')

    it('should correctly encrypt', () => {
        const aes = ige256Encrypt(data, key, iv)

        expect(Buffer.from(aes).toString('hex')).to.equal(dataEnc.toString('hex'))
    })

    it('should correctly decrypt', () => {
        const aes = ige256Decrypt(dataEnc, key, iv)

        expect(Buffer.from(aes).toString('hex')).to.equal(data.toString('hex'))
    })

    it('should not leak memory', () => {
        const mem = __getWasm().memory.buffer
        const memSize = mem.byteLength

        for (let i = 0; i < 10000; i++) {
            ige256Decrypt(ige256Encrypt(data, key, iv), key, iv)
        }

        expect(mem.byteLength).to.equal(memSize)
    })
})
