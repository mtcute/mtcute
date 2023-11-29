import { beforeAll, describe, expect, it } from 'vitest'

import { hexDecodeToBuffer, hexEncode } from '@mtcute/tl-runtime'

import { __getWasm, createCtr256, ctr256, freeCtr256, initAsync } from '../src/index.js'

beforeAll(async () => {
    await initAsync()
})

describe('aes-ctr', () => {
    const key = hexDecodeToBuffer('603DEB1015CA71BE2B73AEF0857D77811F352C073B6108D72D9810A30914DFF4')
    const iv = hexDecodeToBuffer('F0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF')

    describe('NIST', () => {
        // https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/AES_CTR.pdf
        const data = hexDecodeToBuffer(
            `6BC1BEE2 2E409F96 E93D7E11 7393172A
            AE2D8A57 1E03AC9C 9EB76FAC 45AF8E51
            30C81C46 A35CE411 E5FBC119 1A0A52EF
            F69F2445 DF4F9B17 AD2B417B E66C3710`.replace(/\s/g, ''),
        )
        const dataEnc = hexDecodeToBuffer(
            `601EC313 775789A5 B7A7F504 BBF3D228
            F443E3CA 4D62B59A CA84E990 CACAF5C5
            2B0930DA A23DE94C E87017BA 2D84988D
            DFC9C58D B67AADA6 13C2DD08 457941A6`.replace(/\s/g, ''),
        )

        it('should correctly encrypt', () => {
            const ctr = createCtr256(key, iv)
            const res = ctr256(ctr, data)
            freeCtr256(ctr)

            expect(hexEncode(res)).toEqual(hexEncode(dataEnc))
        })

        it('should correctly decrypt', () => {
            const ctr = createCtr256(key, iv)
            const res = ctr256(ctr, dataEnc)
            freeCtr256(ctr)

            expect(hexEncode(res)).toEqual(hexEncode(data))
        })
    })

    describe('stream', () => {
        const data = hexDecodeToBuffer('6BC1BEE22E409F96E93D7E117393172A')
        const dataEnc1 = hexDecodeToBuffer('601ec313775789a5b7a7f504bbf3d228')
        const dataEnc2 = hexDecodeToBuffer('31afd77f7d218690bd0ef82dfcf66cbe')
        const dataEnc3 = hexDecodeToBuffer('7000927e2f2192cbe4b6a8b2441ddd48')

        it('should correctly encrypt', () => {
            const ctr = createCtr256(key, iv)
            const res1 = ctr256(ctr, data)
            const res2 = ctr256(ctr, data)
            const res3 = ctr256(ctr, data)

            freeCtr256(ctr)

            expect(hexEncode(res1)).toEqual(hexEncode(dataEnc1))
            expect(hexEncode(res2)).toEqual(hexEncode(dataEnc2))
            expect(hexEncode(res3)).toEqual(hexEncode(dataEnc3))
        })

        it('should correctly decrypt', () => {
            const ctr = createCtr256(key, iv)
            const res1 = ctr256(ctr, dataEnc1)
            const res2 = ctr256(ctr, dataEnc2)
            const res3 = ctr256(ctr, dataEnc3)

            freeCtr256(ctr)

            expect(hexEncode(res1)).toEqual(hexEncode(data))
            expect(hexEncode(res2)).toEqual(hexEncode(data))
            expect(hexEncode(res3)).toEqual(hexEncode(data))
        })
    })

    describe('stream (unaligned)', () => {
        const data = hexDecodeToBuffer('6BC1BEE22E40')
        const dataEnc1 = hexDecodeToBuffer('601ec3137757')
        const dataEnc2 = hexDecodeToBuffer('7df2e078a555')
        const dataEnc3 = hexDecodeToBuffer('a3a17be0742e')
        const dataEnc4 = hexDecodeToBuffer('025ced833746')
        const dataEnc5 = hexDecodeToBuffer('3ff238dea125')
        const dataEnc6 = hexDecodeToBuffer('1055a52302dc')

        it('should correctly encrypt', () => {
            const ctr = createCtr256(key, iv)
            const res1 = ctr256(ctr, data)
            const res2 = ctr256(ctr, data)
            const res3 = ctr256(ctr, data)
            const res4 = ctr256(ctr, data)
            const res5 = ctr256(ctr, data)
            const res6 = ctr256(ctr, data)

            freeCtr256(ctr)

            expect(hexEncode(res1)).toEqual(hexEncode(dataEnc1))
            expect(hexEncode(res2)).toEqual(hexEncode(dataEnc2))
            expect(hexEncode(res3)).toEqual(hexEncode(dataEnc3))
            expect(hexEncode(res4)).toEqual(hexEncode(dataEnc4))
            expect(hexEncode(res5)).toEqual(hexEncode(dataEnc5))
            expect(hexEncode(res6)).toEqual(hexEncode(dataEnc6))
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

            expect(hexEncode(res1)).toEqual(hexEncode(data))
            expect(hexEncode(res2)).toEqual(hexEncode(data))
            expect(hexEncode(res3)).toEqual(hexEncode(data))
            expect(hexEncode(res4)).toEqual(hexEncode(data))
            expect(hexEncode(res5)).toEqual(hexEncode(data))
            expect(hexEncode(res6)).toEqual(hexEncode(data))
        })
    })

    it('should not leak memory', () => {
        const data = hexDecodeToBuffer('6BC1BEE22E409F96E93D7E117393172A')
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

        expect(mem.byteLength).toEqual(memSize)
    })
})
