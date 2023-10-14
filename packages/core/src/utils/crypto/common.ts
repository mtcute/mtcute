import type { IEncryptionScheme } from './abstract.js'
import { xorBufferInPlace } from './utils.js'

/**
 * AES mode of operation IGE implementation in JS
 */
export class AesModeOfOperationIge implements IEncryptionScheme {
    private _key: Uint8Array
    private _iv: Uint8Array
    private _aes: IEncryptionScheme

    constructor(key: Uint8Array, iv: Uint8Array, ecb: IEncryptionScheme) {
        this._key = key
        this._iv = iv
        this._aes = ecb
    }

    async encrypt(data: Uint8Array): Promise<Uint8Array> {
        if (data.length % 16 !== 0) {
            throw new Error('invalid plaintext size (must be multiple of 16 bytes)')
        }

        const ciphertext = new Uint8Array(data.length)
        let block = new Uint8Array(16)

        let iv1 = this._iv.subarray(0, 16)
        let iv2 = this._iv.subarray(16, 32)

        for (let i = 0; i < data.length; i += 16) {
            block.set(data.subarray(i, i + 16))
            xorBufferInPlace(block, iv1)
            block = await this._aes.encrypt(block)
            xorBufferInPlace(block, iv2)
            ciphertext.set(block, i)

            iv1 = ciphertext.subarray(i, i + 16)
            iv2 = data.subarray(i, i + 16)
        }

        return ciphertext
    }

    async decrypt(data: Uint8Array): Promise<Uint8Array> {
        if (data.length % 16 !== 0) {
            throw new Error('invalid ciphertext size (must be multiple of 16 bytes)')
        }

        const plaintext = new Uint8Array(data.length)
        let block = new Uint8Array(16)

        let iv1 = this._iv.subarray(16, 32)
        let iv2 = this._iv.subarray(0, 16)

        for (let i = 0; i < data.length; i += 16) {
            block.set(data.subarray(i, i + 16))
            xorBufferInPlace(block, iv1)
            block = await this._aes.decrypt(block)
            xorBufferInPlace(block, iv2)
            plaintext.set(block, i)

            iv1 = plaintext.subarray(i, i + 16)
            iv2 = data.subarray(i, i + 16)
        }

        return plaintext
    }
}
