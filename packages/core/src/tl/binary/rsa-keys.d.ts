/**
 * Information about a single Telegram public RSA key.
 */
export interface TlPublicKey {
    /**
     * RSA key modulus as a hex string
     */
    modulus: string

    /**
     * RSA key exponent (usually `0x10001 = 65537`) as a hex string
     */
    exponent: string

    /**
     * RSA key fingerprint as described in [Telegram docs](https://core.telegram.org/mtproto/auth_key#dh-exchange-initiation)
     * as a hex string
     */
    fingerprint: string

    /**
     * Whether this is an "old" key.
     * New keys should be preferred over old ones.
     */
    old: boolean
}

/**
 * Telegram public keys index.
 *
 * Key is {@link TlPublicKey.fingerprint}, value is the public key it represents.
 *
 * **Note** that this index is meant to be mutable, i.e. new keys
 * (ones fetched from the server) can be added directly here.
 */
type TlPublicKeyIndex = Record<string, TlPublicKey>

export const __publicKeyIndex: TlPublicKeyIndex
