import { expect } from 'chai'
import { describe, it } from 'mocha'
import { createRequire } from 'module'

import { hexDecodeToBuffer, hexEncode, utf8EncodeToBuffer } from '@mtcute/tl-runtime'

import { ForgeCryptoProvider, ICryptoProvider, NodeCryptoProvider } from '../utils.js'

const require = createRequire(import.meta.url)

export function testCryptoProvider(c: ICryptoProvider): void {
    it('should calculate sha1', async () => {
        expect(hexEncode(await c.sha1(utf8EncodeToBuffer('')))).to.eq('da39a3ee5e6b4b0d3255bfef95601890afd80709')
        expect(hexEncode(await c.sha1(utf8EncodeToBuffer('hello')))).to.eq('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
        expect(hexEncode(await c.sha1(hexDecodeToBuffer('aebb1f')))).to.eq('62849d15c5dea495916c5eea8dba5f9551288850')
    })

    it('should calculate sha256', async () => {
        expect(hexEncode(await c.sha256(utf8EncodeToBuffer('')))).to.eq(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        )
        expect(hexEncode(await c.sha256(utf8EncodeToBuffer('hello')))).to.eq(
            '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        )
        expect(hexEncode(await c.sha256(hexDecodeToBuffer('aebb1f')))).to.eq(
            '2d29658aba48f2b286fe8bbddb931b7ad297e5adb5b9a6fc3aab67ef7fbf4e80',
        )
    })

    it('should calculate hmac-sha256', async () => {
        const key = hexDecodeToBuffer('aaeeff')

        expect(hexEncode(await c.hmacSha256(utf8EncodeToBuffer(''), key))).to.eq(
            '642711307c9e4437df09d6ebaa6bdc1b3a810c7f15c50fd1d0f8d7d5490f44dd',
        )
        expect(hexEncode(await c.hmacSha256(utf8EncodeToBuffer('hello'), key))).to.eq(
            '39b00bab151f9868e6501655c580b5542954711181243474d46b894703b1c1c2',
        )
        expect(hexEncode(await c.hmacSha256(hexDecodeToBuffer('aebb1f'), key))).to.eq(
            'a3a7273871808711cab17aba14f58e96f63f3ccfc5097d206f0f00ead2c3dd35',
        )
    })

    it('should derive pbkdf2 key', async () => {
        expect(hexEncode(await c.pbkdf2(utf8EncodeToBuffer('pbkdf2 test'), utf8EncodeToBuffer('some salt'), 10))).to.eq(
            'e43276cfa27f135f261cec8ddcf593fd74ec251038e459c165461f2308f3a7235e0744ee1aed9710b00db28d1a2112e20fea3601c60e770ac57ffe6b33ca8be1',
        )
    })

    it('should encrypt and decrypt aes-ctr', async () => {
        let aes = c.createAesCtr(
            hexDecodeToBuffer('d450aae0bf0060a4af1044886b42a13f7c506b35255d134a7e87ab3f23a9493b'),
            hexDecodeToBuffer('0182de2bd789c295c3c6c875c5e9e190'),
            true,
        )

        expect(hexEncode(await aes.encrypt(new Uint8Array([1, 2, 3])))).eq('a5fea1')
        expect(hexEncode(await aes.encrypt(new Uint8Array([1, 2, 3])))).eq('ab51ca')
        expect(hexEncode(await aes.encrypt(new Uint8Array([1, 2, 3])))).eq('365e5c')
        expect(hexEncode(await aes.encrypt(new Uint8Array([1, 2, 3])))).eq('4b94a9')
        expect(hexEncode(await aes.encrypt(new Uint8Array([1, 2, 3])))).eq('776387')
        expect(hexEncode(await aes.encrypt(new Uint8Array([1, 2, 3])))).eq('c940be')

        aes = c.createAesCtr(
            hexDecodeToBuffer('d450aae0bf0060a4af1044886b42a13f7c506b35255d134a7e87ab3f23a9493b'),
            hexDecodeToBuffer('0182de2bd789c295c3c6c875c5e9e190'),
            false,
        )

        expect(hexEncode(await aes.decrypt(hexDecodeToBuffer('a5fea1')))).eq('010203')
        expect(hexEncode(await aes.decrypt(hexDecodeToBuffer('ab51ca')))).eq('010203')
        expect(hexEncode(await aes.decrypt(hexDecodeToBuffer('365e5c')))).eq('010203')
        expect(hexEncode(await aes.decrypt(hexDecodeToBuffer('4b94a9')))).eq('010203')
        expect(hexEncode(await aes.decrypt(hexDecodeToBuffer('776387')))).eq('010203')
        expect(hexEncode(await aes.decrypt(hexDecodeToBuffer('c940be')))).eq('010203')
    })

    it('should encrypt and decrypt aes-ige', async () => {
        const aes = c.createAesIge(
            hexDecodeToBuffer('5468697320697320616E20696D706C655468697320697320616E20696D706C65'),
            hexDecodeToBuffer('6D656E746174696F6E206F6620494745206D6F646520666F72204F70656E5353'),
        )
        expect(
            hexEncode(
                await aes.encrypt(
                    hexDecodeToBuffer('99706487a1cde613bc6de0b6f24b1c7aa448c8b9c3403e3467a8cad89340f53b'),
                ),
            ),
        ).to.eq('792ea8ae577b1a66cb3bd92679b8030ca54ee631976bd3a04547fdcb4639fa69')
        expect(
            hexEncode(
                await aes.decrypt(
                    hexDecodeToBuffer('792ea8ae577b1a66cb3bd92679b8030ca54ee631976bd3a04547fdcb4639fa69'),
                ),
            ),
        ).to.eq('99706487a1cde613bc6de0b6f24b1c7aa448c8b9c3403e3467a8cad89340f53b')
    })
}

describe('NodeCryptoProvider', () => {
    if (typeof process === 'undefined') {
        console.warn('Skipping NodeCryptoProvider tests')

        return
    }

    testCryptoProvider(new NodeCryptoProvider())
})

describe('ForgeCryptoProvider', () => {
    try {
        require('node-forge')
    } catch (e) {
        console.warn('Skipping ForgeCryptoProvider tests')

        return
    }

    testCryptoProvider(new ForgeCryptoProvider())
})
