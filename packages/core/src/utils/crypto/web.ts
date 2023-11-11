import { ICryptoProvider } from './abstract.js'
import { WasmCryptoProvider, WasmCryptoProviderOptions } from './wasm.js'

const ALGO_TO_SUBTLE: Record<string, string> = {
    sha256: 'SHA-256',
    sha1: 'SHA-1',
    sha512: 'SHA-512',
}

export class WebCryptoProvider extends WasmCryptoProvider implements ICryptoProvider {
    readonly crypto: Crypto

    constructor(params?: WasmCryptoProviderOptions & { crypto?: Crypto }) {
        super(params)
        const crypto = params?.crypto ?? globalThis.crypto

        if (!crypto || !crypto.subtle) {
            throw new Error('WebCrypto is not available')
        }
        this.crypto = crypto
    }

    async pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keylen?: number | undefined,
        algo?: string | undefined,
    ): Promise<Uint8Array> {
        const keyMaterial = await this.crypto.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveBits'])

        return this.crypto.subtle
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
        const keyMaterial = await this.crypto.subtle.importKey(
            'raw',
            key,
            { name: 'HMAC', hash: { name: 'SHA-256' } },
            false,
            ['sign'],
        )

        const res = await this.crypto.subtle.sign({ name: 'HMAC' }, keyMaterial, data)

        return new Uint8Array(res)
    }

    randomFill(buf: Uint8Array): void {
        this.crypto.getRandomValues(buf)
    }
}
