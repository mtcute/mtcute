import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { gzipSync, inflateSync } from 'zlib'

import { getPlatform } from '@mtcute/core/platform.js'
import {
    dataViewFromBuffer,
    ICryptoProvider,
} from '@mtcute/core/utils.js'

import { defaultCryptoProvider } from './platform.js'

// some random 1024 bytes of entropy
const DEFAULT_ENTROPY = `
29afd26df40fb8ed10b6b4ad6d56ef5df9453f88e6ee6adb6e0544ba635dc6a8a990c9b8b980c343936b33fa7f97bae025102532233abb269c489920ef99021b
259ce3a2c964c5c8972b4a84ff96f3375a94b535a9468f2896e2080ac7a32ed58e910474a4b02415e07671cbb5bdd58a5dd26fd137c4c98b8c346571fae6ead3
9dfd612bd6b480b6723433f5218e9d6e271591153fb3ffefc089f7e848d3f4633459fff66b33cf939e5655813149fa34be8625f9bc4814d1ee6cf40e4d0de229
1aa22e68c8ad8cc698103734f9aaf79f2bdc052a787a7a9b3629d1ed38750f88cb0481c0ba30a9c611672f9a4d1dc02637abb4e98913ee810a3b152d3d75f25d
7efdc263c08833569968b1771ebbe843d187e2c917d9ad8e8865e44b69f7b74d72ab86a4ef1891dce196ee11a7c9d7d8074fc0450e745bd3a827d77bb0820b90
3055dc15f0abd897ea740a99606b64d28968d770b5e43492ddbf07a7c75104d3e522be9b72050c0fdae8412cdf49014be21105b87a06cb7202dd580387adc007
6280d98b015a1a413819d817f007939d1490467a1ef85a345584c7e594bb729c12a1233f806e515e7088360219dfa109264310ba84777b93eb1ad3c40727a25a
a5d9cdd6748c6ab2ca0bd4daa2ba8225bce2b066a163bcacf05609fc84055bb86a4742c28addd7d7ab8d87b64cfde0b3f4b3bc8e05f3d0a1a2fadb294860e099
a10b3721b0d5b28918b8fb49a18a82a0fde6680a64ed915637805e35ffe8b2c1d4177ec10d10eaaf24425e0351b6a89e794944e1aa82eb5c0210a37da66cccac
895398cf915a8aa141f611521fc258514a99c02721113942c66f2c9a8f9601ff0044a953d17a47b07ad1b5f8725cc020a1a5239be65db0a43d42c206903740f0
27c3f749ecfff2e646570118cd54db2fec392b44d8eb8377309f3e4d164dbc0530914b117b9d278b06db8359d97442d4dcbcaff93cd9a08a6b06a5ba8725d0d7
06b313a5d792be254d33e087b7a4fafcdf819941b9bec4c6057d4c050bd01eb243efd4e6b707281b127820a2b734c6d8f6b2131bf0b5b215c7a798ff3fe90ceb
da91539fcc7b03d2b8b1381bd6023fff20278344ad944d364ba684842db3901c346335f0d455eda414f99c1e794a86aa3a90bcc6e085eecb0b4bf61198d16ed3
89cfa495f977a37a51502b2f60649f2efd7d89c757b6366776ba4c0612017bf1fbfc682dd62e9960d39cbea854d2dcc708b1db5d268192954d13ee72c0bb1bd8
558a3cf3b02b1cd795b40f7a57780391bb8724883d3f7764846c3823e165b3f8c025f59d896905f9a955478586ce57f820d958a01aa59a4cace7ecdf125df334
fa3de8e50aac96c1275591a1221c32a60a1513370a33a228e00894341b10cf44a6ae6ac250d17a364e956ab1a17b068df3fb2d5b5a672d8a409eeb8b6ca1ade6
`.replace(/\s/g, '')

export function withFakeRandom(provider: ICryptoProvider, source = DEFAULT_ENTROPY): ICryptoProvider {
    const sourceBytes = getPlatform().hexDecode(source)
    let offset = 0

    function getRandomValues(buf: Uint8Array) {
        if (offset + buf.length > sourceBytes.length) {
            throw new Error('not enough entropy')
        }

        buf.set(sourceBytes.subarray(offset, offset + buf.length))
        offset += buf.length
    }

    provider.randomFill = getRandomValues

    return provider
}

export function useFakeMathRandom(source = DEFAULT_ENTROPY): void {
    const sourceBytes = getPlatform().hexDecode(source)
    const dv = dataViewFromBuffer(sourceBytes)

    beforeEach(() => {
        let offset = 0

        vi.spyOn(globalThis.Math, 'random').mockImplementation(() => {
            const ret = dv.getUint32(offset, true) / 0xffffffff
            offset += 4

            return ret
        })
    })
    afterEach(() => {
        vi.spyOn(globalThis.Math, 'random').mockRestore()
    })
}

export async function defaultTestCryptoProvider(source = DEFAULT_ENTROPY): Promise<ICryptoProvider> {
    const prov = withFakeRandom(defaultCryptoProvider, source)
    await prov.initialize?.()

    return prov
}

export function testCryptoProvider(c: ICryptoProvider): void {
    beforeAll(() => c.initialize?.())

    const p = getPlatform()

    function gzipSyncWrap(data: Uint8Array) {
        if (import.meta.env.TEST_ENV === 'browser') {
            // @ts-expect-error fucking crutch because @jspm/core uses Buffer.isBuffer for some reason
            data._isBuffer = true

            return new Uint8Array(gzipSync(data))
        }

        return gzipSync(data)
    }

    function inflateSyncWrap(data: Uint8Array) {
        if (import.meta.env.TEST_ENV === 'browser') {
            // @ts-expect-error fucking crutch because @jspm/core uses Buffer.isBuffer for some reason
            data._isBuffer = true

            return new Uint8Array(inflateSync(data))
        }

        return inflateSync(data)
    }

    it('should calculate sha1', () => {
        expect(p.hexEncode(c.sha1(p.utf8Encode('')))).to.eq('da39a3ee5e6b4b0d3255bfef95601890afd80709')
        expect(p.hexEncode(c.sha1(p.utf8Encode('hello')))).to.eq('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
        expect(p.hexEncode(c.sha1(p.hexDecode('aebb1f')))).to.eq('62849d15c5dea495916c5eea8dba5f9551288850')
    })

    it('should calculate sha256', () => {
        expect(p.hexEncode(c.sha256(p.utf8Encode('')))).to.eq(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        )
        expect(p.hexEncode(c.sha256(p.utf8Encode('hello')))).to.eq(
            '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        )
        expect(p.hexEncode(c.sha256(p.hexDecode('aebb1f')))).to.eq(
            '2d29658aba48f2b286fe8bbddb931b7ad297e5adb5b9a6fc3aab67ef7fbf4e80',
        )
    })

    it('should calculate hmac-sha256', async () => {
        const key = p.hexDecode('aaeeff')

        expect(p.hexEncode(await c.hmacSha256(p.utf8Encode(''), key))).to.eq(
            '642711307c9e4437df09d6ebaa6bdc1b3a810c7f15c50fd1d0f8d7d5490f44dd',
        )
        expect(p.hexEncode(await c.hmacSha256(p.utf8Encode('hello'), key))).to.eq(
            '39b00bab151f9868e6501655c580b5542954711181243474d46b894703b1c1c2',
        )
        expect(p.hexEncode(await c.hmacSha256(p.hexDecode('aebb1f'), key))).to.eq(
            'a3a7273871808711cab17aba14f58e96f63f3ccfc5097d206f0f00ead2c3dd35',
        )
    })

    it('should derive pbkdf2 key', async () => {
        expect(p.hexEncode(await c.pbkdf2(p.utf8Encode('pbkdf2 test'), p.utf8Encode('some salt'), 10))).to.eq(
            'e43276cfa27f135f261cec8ddcf593fd74ec251038e459c165461f2308f3a7235e0744ee1aed9710b00db28d1a2112e20fea3601c60e770ac57ffe6b33ca8be1',
        )
    })

    it('should encrypt and decrypt aes-ctr', () => {
        let aes = c.createAesCtr(
            p.hexDecode('d450aae0bf0060a4af1044886b42a13f7c506b35255d134a7e87ab3f23a9493b'),
            p.hexDecode('0182de2bd789c295c3c6c875c5e9e190'),
            true,
        )

        const data = p.hexDecode('7baae571e4c2f4cfadb1931d5923aca7')
        expect(p.hexEncode(aes.process(data))).eq('df5647dbb70bc393f2fb05b72f42286f')
        expect(p.hexEncode(aes.process(data))).eq('3917147082672516b3177150129bc579')
        expect(p.hexEncode(aes.process(data))).eq('2a7a9089270a5de45d5e3dd399cac725')
        expect(p.hexEncode(aes.process(data))).eq('56d085217771398ac13583de4d677dd8')
        expect(p.hexEncode(aes.process(data))).eq('cc639b488126cf36e79c4515e8012b92')
        expect(p.hexEncode(aes.process(data))).eq('01384d100646cd562cc5586ec3f8f8c4')

        aes.close?.()
        aes = c.createAesCtr(
            p.hexDecode('d450aae0bf0060a4af1044886b42a13f7c506b35255d134a7e87ab3f23a9493b'),
            p.hexDecode('0182de2bd789c295c3c6c875c5e9e190'),
            false,
        )

        expect(p.hexEncode(aes.process(p.hexDecode('df5647dbb70bc393f2fb05b72f42286f')))).eq(p.hexEncode(data))
        expect(p.hexEncode(aes.process(p.hexDecode('3917147082672516b3177150129bc579')))).eq(p.hexEncode(data))
        expect(p.hexEncode(aes.process(p.hexDecode('2a7a9089270a5de45d5e3dd399cac725')))).eq(p.hexEncode(data))
        expect(p.hexEncode(aes.process(p.hexDecode('56d085217771398ac13583de4d677dd8')))).eq(p.hexEncode(data))
        expect(p.hexEncode(aes.process(p.hexDecode('cc639b488126cf36e79c4515e8012b92')))).eq(p.hexEncode(data))
        expect(p.hexEncode(aes.process(p.hexDecode('01384d100646cd562cc5586ec3f8f8c4')))).eq(p.hexEncode(data))

        aes.close?.()
    })

    it('should encrypt and decrypt aes-ige', () => {
        const aes = c.createAesIge(
            p.hexDecode('5468697320697320616E20696D706C655468697320697320616E20696D706C65'),
            p.hexDecode('6D656E746174696F6E206F6620494745206D6F646520666F72204F70656E5353'),
        )
        expect(
            p.hexEncode(
                aes.encrypt(p.hexDecode('99706487a1cde613bc6de0b6f24b1c7aa448c8b9c3403e3467a8cad89340f53b')),
            ),
        ).to.eq('792ea8ae577b1a66cb3bd92679b8030ca54ee631976bd3a04547fdcb4639fa69')
        expect(
            p.hexEncode(
                aes.decrypt(p.hexDecode('792ea8ae577b1a66cb3bd92679b8030ca54ee631976bd3a04547fdcb4639fa69')),
            ),
        ).to.eq('99706487a1cde613bc6de0b6f24b1c7aa448c8b9c3403e3467a8cad89340f53b')
    })

    it(
        'should decompose PQ to prime factors P and Q',
        async () => {
            const testFactorization = async (pq: string, p_: string, q: string) => {
                const [p1, q1] = await c.factorizePQ(p.hexDecode(pq))
                expect(p.hexEncode(p1)).eq(p_.toLowerCase())
                expect(p.hexEncode(q1)).eq(q.toLowerCase())
            }

            // from samples at https://core.telegram.org/mtproto/samples-auth_key
            await testFactorization('17ED48941A08F981', '494C553B', '53911073')
            // random example
            await testFactorization('14fcab4dfc861f45', '494c5c99', '494c778d')
        },
        // since PQ factorization relies on RNG, it may take a while (or may not!)
        { timeout: 10000 },
    )

    it('should correctly gzip', () => {
        const data = new Uint8Array(1000).fill(0x42)

        const compressed = c.gzip(data, 100)

        expect(compressed).not.toBeNull()

        const decompressed = inflateSyncWrap(compressed!)

        expect(compressed!.length).toBeLessThan(data.length)
        expect(p.hexEncode(decompressed)).toEqual(p.hexEncode(data))
    })

    it('should correctly gunzip', () => {
        const data = new Uint8Array(1000).fill(0x42)

        const compressed = gzipSyncWrap(data)
        const decompressed = c.gunzip(compressed)

        expect(p.hexEncode(decompressed)).toEqual(p.hexEncode(data))
    })

    describe('randomBytes', () => {
        it('should return exactly N bytes', () => {
            expect(c.randomBytes(0).length).eq(0)
            expect(c.randomBytes(5).length).eq(5)
            expect(c.randomBytes(10).length).eq(10)
            expect(c.randomBytes(256).length).eq(256)
        })

        it('should not be deterministic', () => {
            expect([...c.randomBytes(8)]).not.eql([...c.randomBytes(8)])
        })

        it('should use randomFill', () => {
            const spy = vi.spyOn(c, 'randomFill')
            c.randomBytes(8)

            expect(spy).toHaveBeenCalled()
        })
    })
}

export function u8HexDecode(hex: string) {
    const buf = getPlatform().hexDecode(hex)

    // eslint-disable-next-line no-restricted-globals
    if ((import.meta.env.TEST_ENV === 'node' || import.meta.env.TEST_ENV === 'bun') && Buffer.isBuffer(buf)) {
        return new Uint8Array(buf)
    }

    return buf
}
