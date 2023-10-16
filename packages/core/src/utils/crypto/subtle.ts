import { MaybeAsync } from '../../index.js'
import { BaseCryptoProvider, ICryptoProvider, IEncryptionScheme } from './abstract.js'

import AES_, { CTR } from '@cryptography/aes'

// fucking weird flex with es modules.
// i hate default imports please for the love of god never use them
type AES_ = typeof AES_.default
const AES = 'default' in AES_ ? AES_.default : AES_ as AES_

const ALGO_TO_SUBTLE: Record<string, string> = {
    sha256: 'SHA-256',
    sha1: 'SHA-1',
    sha512: 'SHA-512',
}

function wordsToBytes(words: Uint32Array): Uint8Array {
    const o = new Uint8Array(words.byteLength)

    const len = words.length * 4

    for (let i = 0; i < len; ++i) {
        o[i] = ((words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)
    }

    return o
}

export class SubtleCryptoProvider extends BaseCryptoProvider implements ICryptoProvider {
    constructor(
        readonly subtle: SubtleCrypto,
    ) {
        super()
    }

    sha1(data: Uint8Array): MaybeAsync<Uint8Array> {
        return this.subtle.digest('SHA-1', data).then((result) => new Uint8Array(result))
    }

    sha256(data: Uint8Array): MaybeAsync<Uint8Array> {
        return this.subtle.digest('SHA-256', data).then((result) => new Uint8Array(result))
    }

    async pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen?: number | undefined,
        algo?: string | undefined,
    ): Promise<Uint8Array> {
        const keyMaterial = await this.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveBits'])

        return this.subtle
            .deriveBits(
                {
                    name: 'PBKDF2',
                    salt,
                    iterations,
                    hash: algo ? ALGO_TO_SUBTLE[algo] : 'SHA-512',
                },
                keyMaterial,
                (keylen || 64) * 8,
            )
            .then((result) => new Uint8Array(result))
    }

    async hmacSha256(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
        const keyMaterial = await this.subtle.importKey(
            'raw',
            key,
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign'],
        )

        const res = await this.subtle.sign({ name: 'HMAC' }, keyMaterial, data)

        return new Uint8Array(res)
    }

    createAesCtr(key: Uint8Array, iv: Uint8Array): IEncryptionScheme {
        const aes = new CTR(key, iv)

        return {
            encrypt: (data) => wordsToBytes(aes.encrypt(data)),
            decrypt: (data) => wordsToBytes(aes.decrypt(data)),
        }
    }

    createAesEcb(key: Uint8Array): IEncryptionScheme {
        const aes = new AES(key)

        return {
            encrypt: (data) => wordsToBytes(aes.encrypt(data)),
            decrypt: (data) => wordsToBytes(aes.decrypt(data)),
        }
    }
}
