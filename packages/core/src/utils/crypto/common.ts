import type { IEncryptionScheme } from './abstract'
import { xorBufferInPlace } from './utils'

/**
 * AES mode of operation IGE implementation in JS
 */
export class AesModeOfOperationIge implements IEncryptionScheme {
    private _key: Buffer
    private _iv: Buffer
    private _aes: IEncryptionScheme

    constructor(key: Buffer, iv: Buffer, ecb: IEncryptionScheme) {
        this._key = key
        this._iv = iv
        this._aes = ecb
    }

    async encrypt(data: Buffer): Promise<Buffer> {
        if (data.length % 16 !== 0) {
            throw new Error('invalid plaintext size (must be multiple of 16 bytes)')
        }

        const ciphertext = Buffer.alloc(data.length)
        let block = Buffer.alloc(16)

        let iv1 = this._iv.slice(0, 16)
        let iv2 = this._iv.slice(16, 32)

        for (let i = 0; i < data.length; i += 16) {
            data.copy(block, 0, i, i + 16)
            xorBufferInPlace(block, iv1)
            block = await this._aes.encrypt(block)
            xorBufferInPlace(block, iv2)
            block.copy(ciphertext, i)

            iv1 = ciphertext.slice(i, i + 16)
            iv2 = data.slice(i, i + 16)
        }

        return ciphertext
    }

    async decrypt(data: Buffer): Promise<Buffer> {
        if (data.length % 16 !== 0) {
            throw new Error('invalid ciphertext size (must be multiple of 16 bytes)')
        }

        const plaintext = Buffer.alloc(data.length)
        let block = Buffer.alloc(16)

        let iv1 = this._iv.slice(16, 32)
        let iv2 = this._iv.slice(0, 16)

        for (let i = 0; i < data.length; i += 16) {
            data.copy(block, 0, i, i + 16)
            xorBufferInPlace(block, iv1)
            block = await this._aes.decrypt(block)
            xorBufferInPlace(block, iv2)
            block.copy(plaintext, i)

            iv1 = plaintext.slice(i, i + 16)
            iv2 = data.slice(i, i + 16)
        }

        return plaintext
    }
}
