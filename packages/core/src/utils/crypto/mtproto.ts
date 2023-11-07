import { concatBuffers } from '../buffer-utils.js'
import { ICryptoProvider, IEncryptionScheme } from './abstract.js'

/**
 * Generate AES key and IV from nonces as defined by MTProto.
 * Used in authorization flow.
 *
 * @param crypto  Crypto provider
 * @param serverNonce  Server nonce
 * @param newNonce  New nonce
 * @returns  Tuple: `[key, iv]`
 */
export function generateKeyAndIvFromNonce(
    crypto: ICryptoProvider,
    serverNonce: Uint8Array,
    newNonce: Uint8Array,
): [Uint8Array, Uint8Array] {
    const hash1 = crypto.sha1(concatBuffers([newNonce, serverNonce]))
    const hash2 = crypto.sha1(concatBuffers([serverNonce, newNonce]))
    const hash3 = crypto.sha1(concatBuffers([newNonce, newNonce]))

    const key = concatBuffers([hash1, hash2.subarray(0, 12)])
    const iv = concatBuffers([hash2.subarray(12, 20), hash3, newNonce.subarray(0, 4)])

    return [key, iv]
}

/**
 * Create AES IGE instance for message (given auth key and message key)
 * as defined by MTProto v2.
 *
 * @param crypto  Crypto provider
 * @param authKey  Authorization key
 * @param messageKey  Message key
 * @param client  Whether this is a client to server message
 */
export function createAesIgeForMessage(
    crypto: ICryptoProvider,
    authKey: Uint8Array,
    messageKey: Uint8Array,
    client: boolean,
): IEncryptionScheme {
    const x = client ? 0 : 8
    const sha256a = crypto.sha256(concatBuffers([messageKey, authKey.subarray(x, 36 + x)]))
    const sha256b = crypto.sha256(concatBuffers([authKey.subarray(40 + x, 76 + x), messageKey]))

    const key = concatBuffers([sha256a.subarray(0, 8), sha256b.subarray(8, 24), sha256a.subarray(24, 32)])
    const iv = concatBuffers([sha256b.subarray(0, 8), sha256a.subarray(8, 24), sha256b.subarray(24, 32)])

    return crypto.createAesIge(key, iv)
}

/**
 * Create AES IGE instance for file (given auth key and message key)
 * as defined by MTProto v1.
 *
 * @param crypto  Crypto provider
 * @param authKey  Authorization key
 * @param messageKey  Message key
 * @param client  Whether this is a client to server message
 */
export function createAesIgeForMessageOld(
    crypto: ICryptoProvider,
    authKey: Uint8Array,
    messageKey: Uint8Array,
    client: boolean,
): IEncryptionScheme {
    const x = client ? 0 : 8
    const sha1a = crypto.sha1(concatBuffers([messageKey, authKey.subarray(x, 32 + x)]))
    const sha1b = crypto.sha1(
        concatBuffers([authKey.subarray(32 + x, 48 + x), messageKey, authKey.subarray(48 + x, 64 + x)]),
    )
    const sha1c = crypto.sha1(concatBuffers([authKey.subarray(64 + x, 96 + x), messageKey]))
    const sha1d = crypto.sha1(concatBuffers([messageKey, authKey.subarray(96 + x, 128 + x)]))

    const key = concatBuffers([sha1a.subarray(0, 8), sha1b.subarray(8, 20), sha1c.subarray(4, 16)])
    const iv = concatBuffers([
        sha1a.subarray(8, 20),
        sha1b.subarray(0, 8),
        sha1c.subarray(16, 20),
        sha1d.subarray(0, 8),
    ])

    return crypto.createAesIge(key, iv)
}
