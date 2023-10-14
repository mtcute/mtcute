import { createRequire } from 'module'
import type * as forgeNs from 'node-forge'

import { MaybeAsync } from '../../types/index.js'
import { BaseCryptoProvider, ICryptoProvider, IEncryptionScheme } from './abstract.js'

type forge = typeof forgeNs
let forge: forge | null = null

try {
    // @only-if-esm
    const require = createRequire(import.meta.url)
    // @/only-if-esm
    forge = require('node-forge') as forge
} catch (e) {}

function toLatin1String(buf: Uint8Array): string {
    let ret = ''

    for (let i = 0; i < buf.length; ++i) {
        ret += String.fromCharCode(buf[i])
    }

    return ret
}

function fromLatin1String(str: string): Uint8Array {
    const buf = new Uint8Array(str.length)

    for (let i = 0; i < str.length; ++i) {
        buf[i] = str.charCodeAt(i)
    }

    return buf
}

export class ForgeCryptoProvider extends BaseCryptoProvider implements ICryptoProvider {
    constructor() {
        super()

        if (!forge) {
            throw new Error('For ForgeCryptoProvider you must have node-forge installed!')
        }
    }

    createAesCtr(key: Uint8Array, iv: Uint8Array, encrypt: boolean): IEncryptionScheme {
        const cipher = forge!.cipher[encrypt ? 'createCipher' : 'createDecipher']('AES-CTR', toLatin1String(key))
        cipher.start({ iv: toLatin1String(iv) })

        const update = (data: Uint8Array): Uint8Array => {
            cipher.output.data = ''
            cipher.update(forge!.util.createBuffer(toLatin1String(data)))

            return fromLatin1String(cipher.output.data)
        }

        return {
            encrypt: update,
            decrypt: update,
        }
    }

    createAesEcb(key: Uint8Array): IEncryptionScheme {
        const keyBuffer = toLatin1String(key)

        return {
            encrypt(data: Uint8Array) {
                const cipher = forge!.cipher.createCipher('AES-ECB', keyBuffer)
                cipher.start({})
                // @ts-expect-error  wrong types
                cipher.mode.pad = cipher.mode.unpad = false
                cipher.update(forge!.util.createBuffer(toLatin1String(data)))
                cipher.finish()

                return fromLatin1String(cipher.output.data)
            },
            decrypt(data: Uint8Array) {
                const cipher = forge!.cipher.createDecipher('AES-ECB', keyBuffer)
                cipher.start({})
                // @ts-expect-error  wrong types
                cipher.mode.pad = cipher.mode.unpad = false
                cipher.update(forge!.util.createBuffer(toLatin1String(data)))
                cipher.finish()

                return fromLatin1String(cipher.output.data)
            },
        }
    }

    pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen = 64,
        algo = 'sha512',
    ): MaybeAsync<Uint8Array> {
        return new Promise((resolve, reject) =>
            forge!.pkcs5.pbkdf2(
                toLatin1String(password),
                toLatin1String(salt),
                iterations,
                keylen,
                // eslint-disable-next-line
                (forge!.md as any)[algo].create(),
                (err: Error | null, buf: string) => (err !== null ? reject(err) : resolve(fromLatin1String(buf))),
            ),
        )
    }

    sha1(data: Uint8Array): MaybeAsync<Uint8Array> {
        return fromLatin1String(forge!.md.sha1.create().update(toLatin1String(data)).digest().data)
    }

    sha256(data: Uint8Array): MaybeAsync<Uint8Array> {
        return fromLatin1String(forge!.md.sha256.create().update(toLatin1String(data)).digest().data)
    }

    hmacSha256(data: Uint8Array, key: Uint8Array): MaybeAsync<Uint8Array> {
        const hmac = forge!.hmac.create()
        hmac.start('sha256', toLatin1String(key))
        hmac.update(toLatin1String(data))

        return fromLatin1String(hmac.digest().data)
    }
}
