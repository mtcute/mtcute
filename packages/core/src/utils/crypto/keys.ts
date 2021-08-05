// This file was auto-generated. Do not edit.
import { BigInteger } from 'big-integer'
import { parseAsn1, parsePemContents } from '../binary/asn1-parser'
import { BinaryWriter } from '../binary/binary-writer'
import { ICryptoProvider } from './abstract'
import keysIndex, { TlPublicKey } from '@mtcute/tl/binary/rsa-keys'

export async function parsePublicKey(
    crypto: ICryptoProvider,
    key: string,
    old = false
): Promise<TlPublicKey> {
    const asn1 = parseAsn1(parsePemContents(key))
    const modulus = asn1.children?.[0].value
    const exponent = asn1.children?.[1].value
    if (!modulus || !exponent) throw new Error('Invalid public key')

    const writer = BinaryWriter.alloc(512) // they are actually smaller, about 270 bytes, but idc :D
    writer.bytes(modulus)
    writer.bytes(exponent)

    const data = writer.result()
    const sha = await crypto.sha1(data)
    const fp = sha.slice(-8).reverse().toString('hex')

    return {
        modulus: modulus.toString('hex'),
        exponent: exponent.toString('hex'),
        fingerprint: fp,
        old,
    }
}

export async function addPublicKey(
    crypto: ICryptoProvider,
    key: string,
    old = false
): Promise<void> {
    const parsed = await parsePublicKey(crypto, key, old)
    keysIndex[parsed.fingerprint] = parsed
}

export function findKeyByFingerprints(
    fingerprints: (string | BigInteger)[],
    allowOld = false
): TlPublicKey | null {
    for (let fp of fingerprints) {
        if (typeof fp !== 'string') fp = fp.toString(16)
        if (fp in keysIndex) {
            if (keysIndex[fp].old && !allowOld) continue
            return keysIndex[fp]
        }
    }
    if (!allowOld) return findKeyByFingerprints(fingerprints, true)
    return null
}
