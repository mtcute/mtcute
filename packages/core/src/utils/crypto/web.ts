import { ICryptoProvider } from './abstract.js'
import { WasmCryptoProvider, WasmCryptoProviderOptions } from './wasm.js'

const ALGO_TO_SUBTLE: Record<string, string> = {
    sha256: 'SHA-256',
    sha1: 'SHA-1',
    sha512: 'SHA-512',
}

export class WebCryptoProvider extends WasmCryptoProvider implements ICryptoProvider {
    readonly subtle: SubtleCrypto

    constructor(params?: WasmCryptoProviderOptions & { subtle?: SubtleCrypto }) {
        super(params)
        const subtle = params?.subtle ?? globalThis.crypto?.subtle

        if (!subtle) {
            throw new Error('SubtleCrypto is not available')
        }
        this.subtle = subtle
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
}
