import { NodeCryptoProvider } from '@mtcute/node/utils.js'
import { ige256Decrypt, ige256Encrypt } from '@mtcute/wasm'
import { expect } from 'chai'
import { before, describe, it } from 'mocha'

before(async () => {
    await new NodeCryptoProvider().initialize()
})

describe('@mtcute/wasm', () => {
    const key = Buffer.from('5468697320697320616E20696D706C655468697320697320616E20696D706C65', 'hex')
    const iv = Buffer.from('6D656E746174696F6E206F6620494745206D6F646520666F72204F70656E5353', 'hex')

    const data = Buffer.from('99706487a1cde613bc6de0b6f24b1c7aa448c8b9c3403e3467a8cad89340f53b', 'hex')
    const dataEnc = Buffer.from('792ea8ae577b1a66cb3bd92679b8030ca54ee631976bd3a04547fdcb4639fa69', 'hex')

    it('should work with Buffers', () => {
        expect(ige256Encrypt(data, key, iv)).to.deep.equal(new Uint8Array(dataEnc))
        expect(ige256Decrypt(dataEnc, key, iv)).to.deep.equal(new Uint8Array(data))
    })

    it('should work with Uint8Arrays', () => {
        expect(ige256Encrypt(new Uint8Array(data), new Uint8Array(key), new Uint8Array(iv))).to.deep.equal(
            new Uint8Array(dataEnc),
        )
        expect(ige256Decrypt(new Uint8Array(dataEnc), new Uint8Array(key), new Uint8Array(iv))).to.deep.equal(
            new Uint8Array(data),
        )
    })
})
