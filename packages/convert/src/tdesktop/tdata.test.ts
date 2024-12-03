import type { INodeFsLike } from '../utils/fs.js'
import { Long } from '@mtcute/core'

import { describe, expect, it } from 'vitest'

class FakeFs implements INodeFsLike {
    readonly files = new Map<string, Uint8Array>()

    async readFile(path: string): Promise<Uint8Array> {
        return this.files.get(path)!
    }

    async writeFile(path: string, data: Uint8Array): Promise<void> {
        this.files.set(path, data)
    }

    async stat(path: string): Promise<{ size: number, lastModified: number }> {
        return {
            size: this.files.get(path)!.length,
            lastModified: 0,
        }
    }

    mkdir(): Promise<void> {
        return Promise.resolve()
    }
}

if (import.meta.env.TEST_ENV === 'node') {
    describe('tdata', async () => {
        const { getDefaultCryptoProvider } = await import('../utils/crypto.js')
        const { fileURLToPath } = await import('node:url')
        const { Tdata } = await import('./tdata.js')

        it('should read simple tdata', async () => {
            const tdata = await Tdata.open({
                path: fileURLToPath(new URL('./__fixtures__/simple', import.meta.url)),
            })

            const auth = await tdata.readMtpAuthorization()

            expect({ auth, key: tdata.keyData }).toMatchSnapshot()
        })

        it('should read passcode-protected tdata', async () => {
            const tdata = await Tdata.open({
                path: fileURLToPath(new URL('./__fixtures__/passcode', import.meta.url)),
                passcode: '123123',
            })

            const auth = await tdata.readMtpAuthorization()

            expect({ auth, key: tdata.keyData }).toMatchSnapshot()
        })

        it('should throw on invalid passcode', async () => {
            await expect(Tdata.open({
                path: fileURLToPath(new URL('./__fixtures__/passcode', import.meta.url)),
                passcode: '123',
            })).rejects.toThrow('Failed to decrypt, invalid password?')
        })

        it('should read multi-account tdata', async () => {
            const tdata = await Tdata.open({
                path: fileURLToPath(new URL('./__fixtures__/multiacc', import.meta.url)),
            })

            const auth0 = await tdata.readMtpAuthorization(0)
            const auth1 = await tdata.readMtpAuthorization(1)

            expect({ auth0, auth1, key: tdata.keyData }).toMatchSnapshot()
        })

        it('should write simple tdata', async () => {
            const fs = new FakeFs()
            const crypto = await getDefaultCryptoProvider()
            crypto.randomBytes = size => new Uint8Array(size)

            const tdata = await Tdata.create({
                path: '/',
                fs,
                crypto,
                keyData: {
                    count: 1,
                    order: [0],
                    active: 0,
                },
            })

            const key = new Uint8Array(256)
            key.fill(1)
            await tdata.writeMtpAuthorization({
                userId: Long.fromNumber(12345678),
                mainDcId: 2,
                authKeys: [
                    {
                        dcId: 2,
                        key,
                    },
                ],
                authKeysToDestroy: [],
            })

            expect(fs.files).toMatchSnapshot()
        })
    })
} else {
    describe.skip('tdata', () => {})
}
