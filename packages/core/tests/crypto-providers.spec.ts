import { expect } from 'chai'
import { describe, it } from 'mocha'

import {
    ForgeCryptoProvider,
    ICryptoProvider,
    NodeCryptoProvider,
} from '../utils'

export function testCryptoProvider(c: ICryptoProvider): void {
    it('should calculate sha1', async () => {
        expect((await c.sha1(Buffer.from(''))).toString('hex')).to.eq(
            'da39a3ee5e6b4b0d3255bfef95601890afd80709',
        )
        expect((await c.sha1(Buffer.from('hello'))).toString('hex')).to.eq(
            'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
        )
        expect(
            (await c.sha1(Buffer.from('aebb1f', 'hex'))).toString('hex'),
        ).to.eq('62849d15c5dea495916c5eea8dba5f9551288850')
    })

    it('should calculate sha256', async () => {
        expect((await c.sha256(Buffer.from(''))).toString('hex')).to.eq(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        )
        expect((await c.sha256(Buffer.from('hello'))).toString('hex')).to.eq(
            '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        )
        expect(
            (await c.sha256(Buffer.from('aebb1f', 'hex'))).toString('hex'),
        ).to.eq(
            '2d29658aba48f2b286fe8bbddb931b7ad297e5adb5b9a6fc3aab67ef7fbf4e80',
        )
    })

    it('should calculate hmac-sha256', async () => {
        const key = Buffer.from('aaeeff', 'hex')

        expect(
            (await c.hmacSha256(Buffer.from(''), key)).toString('hex'),
        ).to.eq(
            '642711307c9e4437df09d6ebaa6bdc1b3a810c7f15c50fd1d0f8d7d5490f44dd',
        )
        expect(
            (await c.hmacSha256(Buffer.from('hello'), key)).toString('hex'),
        ).to.eq(
            '39b00bab151f9868e6501655c580b5542954711181243474d46b894703b1c1c2',
        )
        expect(
            (await c.hmacSha256(Buffer.from('aebb1f', 'hex'), key)).toString(
                'hex',
            ),
        ).to.eq(
            'a3a7273871808711cab17aba14f58e96f63f3ccfc5097d206f0f00ead2c3dd35',
        )
    })

    it('should derive pbkdf2 key', async () => {
        expect(
            (
                await c.pbkdf2(
                    Buffer.from('pbkdf2 test'),
                    Buffer.from('some salt'),
                    10,
                )
            ).toString('hex'),
        ).to.eq(
            'e43276cfa27f135f261cec8ddcf593fd74ec251038e459c165461f2308f3a7235e0744ee1aed9710b00db28d1a2112e20fea3601c60e770ac57ffe6b33ca8be1',
        )
    })

    it('should encrypt and decrypt aes-ctr', async () => {
        let aes = c.createAesCtr(
            Buffer.from(
                'd450aae0bf0060a4af1044886b42a13f7c506b35255d134a7e87ab3f23a9493b',
                'hex',
            ),
            Buffer.from('0182de2bd789c295c3c6c875c5e9e190', 'hex'),
            true,
        )

        expect((await aes.encrypt(Buffer.from([1, 2, 3]))).toString('hex')).eq(
            'a5fea1',
        )
        expect((await aes.encrypt(Buffer.from([1, 2, 3]))).toString('hex')).eq(
            'ab51ca',
        )
        expect((await aes.encrypt(Buffer.from([1, 2, 3]))).toString('hex')).eq(
            '365e5c',
        )
        expect((await aes.encrypt(Buffer.from([1, 2, 3]))).toString('hex')).eq(
            '4b94a9',
        )
        expect((await aes.encrypt(Buffer.from([1, 2, 3]))).toString('hex')).eq(
            '776387',
        )
        expect((await aes.encrypt(Buffer.from([1, 2, 3]))).toString('hex')).eq(
            'c940be',
        )

        aes = c.createAesCtr(
            Buffer.from(
                'd450aae0bf0060a4af1044886b42a13f7c506b35255d134a7e87ab3f23a9493b',
                'hex',
            ),
            Buffer.from('0182de2bd789c295c3c6c875c5e9e190', 'hex'),
            false,
        )

        expect(
            (await aes.decrypt(Buffer.from('a5fea1', 'hex'))).toString('hex'),
        ).eq('010203')
        expect(
            (await aes.decrypt(Buffer.from('ab51ca', 'hex'))).toString('hex'),
        ).eq('010203')
        expect(
            (await aes.decrypt(Buffer.from('365e5c', 'hex'))).toString('hex'),
        ).eq('010203')
        expect(
            (await aes.decrypt(Buffer.from('4b94a9', 'hex'))).toString('hex'),
        ).eq('010203')
        expect(
            (await aes.decrypt(Buffer.from('776387', 'hex'))).toString('hex'),
        ).eq('010203')
        expect(
            (await aes.decrypt(Buffer.from('c940be', 'hex'))).toString('hex'),
        ).eq('010203')
    })

    it('should encrypt and decrypt aes-ige', async () => {
        const aes = c.createAesIge(
            Buffer.from(
                '5468697320697320616E20696D706C655468697320697320616E20696D706C65',
                'hex',
            ),
            Buffer.from(
                '6D656E746174696F6E206F6620494745206D6F646520666F72204F70656E5353',
                'hex',
            ),
        )
        expect(
            (
                await aes.encrypt(
                    Buffer.from(
                        '99706487a1cde613bc6de0b6f24b1c7aa448c8b9c3403e3467a8cad89340f53b',
                        'hex',
                    ),
                )
            ).toString('hex'),
        ).to.eq(
            '792ea8ae577b1a66cb3bd92679b8030ca54ee631976bd3a04547fdcb4639fa69',
        )
        expect(
            (
                await aes.decrypt(
                    Buffer.from(
                        '792ea8ae577b1a66cb3bd92679b8030ca54ee631976bd3a04547fdcb4639fa69',
                        'hex',
                    ),
                )
            ).toString('hex'),
        ).to.eq(
            '99706487a1cde613bc6de0b6f24b1c7aa448c8b9c3403e3467a8cad89340f53b',
        )
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
