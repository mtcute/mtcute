/* eslint-disable no-restricted-globals */
import { expect } from 'chai'
import { before, describe } from 'mocha'

import { __getWasm, createCtr256, ctr256, freeCtr256, initAsync } from '../src/index.js'

before(async () => {
    await initAsync()
})

describe('aes-ctr', () => {
    const key = Buffer.from('603DEB1015CA71BE2B73AEF0857D77811F352C073B6108D72D9810A30914DFF4', 'hex')
    const iv = Buffer.from('F0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF', 'hex')

    describe('NIST', () => {
        // https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/AES_CTR.pdf
        const data = Buffer.from(
            `6BC1BEE2 2E409F96 E93D7E11 7393172A
            AE2D8A57 1E03AC9C 9EB76FAC 45AF8E51
            30C81C46 A35CE411 E5FBC119 1A0A52EF
            F69F2445 DF4F9B17 AD2B417B E66C3710`.replace(/\s/g, ''),
            'hex',
        )
        const dataEnc = Buffer.from(
            `601EC313 775789A5 B7A7F504 BBF3D228
            F443E3CA 4D62B59A CA84E990 CACAF5C5
            2B0930DA A23DE94C E87017BA 2D84988D
            DFC9C58D B67AADA6 13C2DD08 457941A6`.replace(/\s/g, ''),
            'hex',
        )

        it('should correctly encrypt', () => {
            const ctr = createCtr256(key, iv)
            const res = ctr256(ctr, data)
            freeCtr256(ctr)

            expect(Buffer.from(res).toString('hex')).to.equal(dataEnc.toString('hex'))
        })

        it('should correctly decrypt', () => {
            const ctr = createCtr256(key, iv)
            const res = ctr256(ctr, dataEnc)
            freeCtr256(ctr)

            expect(Buffer.from(res).toString('hex')).to.equal(data.toString('hex'))
        })
    })

    describe('stream', () => {
        const data = Buffer.from('6BC1BEE22E409F96E93D7E117393172A', 'hex')
        const dataEnc1 = Buffer.from('601ec313775789a5b7a7f504bbf3d228', 'hex')
        const dataEnc2 = Buffer.from('31afd77f7d218690bd0ef82dfcf66cbe', 'hex')
        const dataEnc3 = Buffer.from('7000927e2f2192cbe4b6a8b2441ddd48', 'hex')

        it('should correctly encrypt', () => {
            const ctr = createCtr256(key, iv)
            const res1 = ctr256(ctr, data)
            const res2 = ctr256(ctr, data)
            const res3 = ctr256(ctr, data)

            freeCtr256(ctr)

            expect(Buffer.from(res1).toString('hex')).to.equal(dataEnc1.toString('hex'))
            expect(Buffer.from(res2).toString('hex')).to.equal(dataEnc2.toString('hex'))
            expect(Buffer.from(res3).toString('hex')).to.equal(dataEnc3.toString('hex'))
        })

        it('should correctly decrypt', () => {
            const ctr = createCtr256(key, iv)
            const res1 = ctr256(ctr, dataEnc1)
            const res2 = ctr256(ctr, dataEnc2)
            const res3 = ctr256(ctr, dataEnc3)

            freeCtr256(ctr)

            expect(Buffer.from(res1).toString('hex')).to.equal(data.toString('hex'))
            expect(Buffer.from(res2).toString('hex')).to.equal(data.toString('hex'))
            expect(Buffer.from(res3).toString('hex')).to.equal(data.toString('hex'))
        })
    })

    describe('stream (unaligned)', () => {
        const data = Buffer.from('6BC1BEE22E40', 'hex')
        const dataEnc1 = Buffer.from('601ec3137757', 'hex')
        const dataEnc2 = Buffer.from('7df2e078a555', 'hex')
        const dataEnc3 = Buffer.from('a3a17be0742e', 'hex')
        const dataEnc4 = Buffer.from('025ced833746', 'hex')
        const dataEnc5 = Buffer.from('3ff238dea125', 'hex')
        const dataEnc6 = Buffer.from('1055a52302dc', 'hex')

        it('should correctly encrypt', () => {
            const ctr = createCtr256(key, iv)
            const res1 = ctr256(ctr, data)
            const res2 = ctr256(ctr, data)
            const res3 = ctr256(ctr, data)
            const res4 = ctr256(ctr, data)
            const res5 = ctr256(ctr, data)
            const res6 = ctr256(ctr, data)

            freeCtr256(ctr)

            expect(Buffer.from(res1).toString('hex')).to.equal(dataEnc1.toString('hex'))
            expect(Buffer.from(res2).toString('hex')).to.equal(dataEnc2.toString('hex'))
            expect(Buffer.from(res3).toString('hex')).to.equal(dataEnc3.toString('hex'))
            expect(Buffer.from(res4).toString('hex')).to.equal(dataEnc4.toString('hex'))
            expect(Buffer.from(res5).toString('hex')).to.equal(dataEnc5.toString('hex'))
            expect(Buffer.from(res6).toString('hex')).to.equal(dataEnc6.toString('hex'))
        })

        it('should correctly decrypt', () => {
            const ctr = createCtr256(key, iv)
            const res1 = ctr256(ctr, dataEnc1)
            const res2 = ctr256(ctr, dataEnc2)
            const res3 = ctr256(ctr, dataEnc3)
            const res4 = ctr256(ctr, dataEnc4)
            const res5 = ctr256(ctr, dataEnc5)
            const res6 = ctr256(ctr, dataEnc6)

            freeCtr256(ctr)

            expect(Buffer.from(res1).toString('hex')).to.equal(data.toString('hex'))
            expect(Buffer.from(res2).toString('hex')).to.equal(data.toString('hex'))
            expect(Buffer.from(res3).toString('hex')).to.equal(data.toString('hex'))
            expect(Buffer.from(res4).toString('hex')).to.equal(data.toString('hex'))
            expect(Buffer.from(res5).toString('hex')).to.equal(data.toString('hex'))
            expect(Buffer.from(res6).toString('hex')).to.equal(data.toString('hex'))
        })
    })

    it('should not leak memory', () => {
        const data = Buffer.from('6BC1BEE22E409F96E93D7E117393172A', 'hex')
        const mem = __getWasm().memory.buffer
        const memSize = mem.byteLength

        for (let i = 0; i < 100; i++) {
            const ctrEnc = createCtr256(key, iv)
            const ctrDec = createCtr256(key, iv)

            for (let i = 0; i < 100; i++) {
                ctr256(ctrDec, ctr256(ctrEnc, data))
            }

            freeCtr256(ctrEnc)
            freeCtr256(ctrDec)
        }

        expect(mem.byteLength).to.equal(memSize)
    })
})
