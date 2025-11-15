import type { TlPublicKey } from '@mtcute/tl/binary/rsa-keys.js'
import type Long from 'long'
import type { ICryptoProvider } from './abstract.js'
import { hex } from '@fuman/utils'
import { TlBinaryWriter } from '@mtcute/tl-runtime'

import { __publicKeyIndex as keysIndex } from '@mtcute/tl/binary/rsa-keys.js'

import { parseAsn1, parsePemContents } from '../binary/asn1-parser.js'

/**
 * Parse PEM-encoded RSA public key information into modulus and exponent
 * and compute its fingerprint as defined by MTProto.
 *
 * @param crypto  Crypto provider
 * @param key  PEM-encoded RSA public key
 * @param old  Whether this is an "old" key
 */
export function parsePublicKey(crypto: ICryptoProvider, key: string, old = false): TlPublicKey {
  const asn1 = parseAsn1(parsePemContents(key))
  const modulus = asn1.children?.[0].value
  const exponent = asn1.children?.[1].value
  if (!modulus || !exponent) throw new Error('Invalid public key')

  const writer = TlBinaryWriter.manual(512)
  // they are actually smaller, about 270 bytes, but idc :D
  writer.bytes(modulus)
  writer.bytes(exponent)

  const data = writer.result()
  const sha = crypto.sha1(data)
  const fp = hex.encode(sha.slice(-8).reverse())

  return {
    modulus: hex.encode(modulus),
    exponent: hex.encode(exponent),
    fingerprint: fp,
    old,
  }
}

/**
 * Add public key to the global index.
 *
 * @param crypto  Crypto provider
 * @param key  PEM-encoded RSA public key
 * @param old  Whether this is an "old" key
 */
export function addPublicKey(crypto: ICryptoProvider, key: string, old = false): void {
  const parsed = parsePublicKey(crypto, key, old)
  keysIndex[parsed.fingerprint] = parsed
}

/**
 * Get public key by its fingerprint.
 *
 * @param fingerprints  Fingerprints to match. The first one to match is returned.
 * @param allowOld  Whether to allow "old" keys
 */
export function findKeyByFingerprints(fingerprints: (string | Long)[], allowOld = false): TlPublicKey | null {
  for (let fp of fingerprints) {
    if (typeof fp !== 'string') {
      fp = fp.toUnsigned().toString(16)
    }
    if (fp in keysIndex) {
      if (keysIndex[fp].old && !allowOld) continue

      return keysIndex[fp]
    }
  }
  if (!allowOld) return findKeyByFingerprints(fingerprints, true)

  return null
}
