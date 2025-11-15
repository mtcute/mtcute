// all available libraries either suck or are extremely large for the use case, so i made my own~

import { base64, hex } from '@fuman/utils'

/**
 * Parses a single PEM block to buffer.
 * In fact just strips begin/end tags and parses the rest as Base64
 */
export function parsePemContents(pem: string): Uint8Array {
  return base64.decode(pem.replace(/^-----(?:BEGIN|END)(?: RSA)? PUBLIC KEY-----$|\n/gm, ''))
}

// based on https://git.coolaj86.com/coolaj86/asn1-parser.js/src/branch/master/asn1-parser.js
// but modified for typescript and node buffers

interface Asn1Object {
  type: number
  lengthSize: number
  length: number
  children?: Asn1Object[]
  value?: Uint8Array
}

const ELOOPN = 102
const ELOOP = `iterated over ${ELOOPN} elements (probably a malformed file)`
const EDEEPN = 60
const EDEEP = `element nested over ${EDEEPN} layers deep (probably a malformed file)`

// Container Types are Sequence 0x30, Container Array? (0xA0, 0xA1)
// Value Types are Boolean 0x01, Integer 0x02, Null 0x05, Object ID 0x06, String 0x0C, 0x16, 0x13, 0x1e
// Value Array? (0x82)
// Bit String (0x03) and Octet String (0x04) may be values or containers
// Sometimes Bit String is used as a container (RSA Pub Spki)
const CTYPES: Record<number, true> = {
  48: true,
  49: true,
  160: true,
  161: true,
}
const VTYPES: Record<number, true> = {
  1: true,
  2: true,
  5: true,
  6: true,
  12: true,
  130: true,
}

/**
 * Parses ASN.1 data to an object
 */
export function parseAsn1(data: Uint8Array): Asn1Object {
  function parseAsn1Inner(buf: Uint8Array, depth: number[], eager = false) {
    if (depth.length >= EDEEPN) {
      throw new Error(EDEEP)
    }

    let index = 2 // we know, at minimum, data starts after type (0) and lengthSize (1)
    const asn1: Asn1Object = { type: buf[0], lengthSize: 0, length: buf[1] }
    let child
    let iters = 0
    let adjust = 0
    let adjustedLen = 0

    // Determine how many bytes the length uses, and what it is
    if (0x80 & asn1.length) {
      asn1.lengthSize = 0x7F & asn1.length
      // I think that buf->hex->int solves the problem of Endianness... not sure
      asn1.length = Number.parseInt(hex.encode(buf.subarray(index, index + asn1.lengthSize)), 16)
      index += asn1.lengthSize
    }

    // High-order bit Integers have a leading 0x00 to signify that they are positive.
    // Bit Streams use the first byte to signify padding, which x.509 doesn't use.
    if (buf[index] === 0x00 && (asn1.type === 0x02 || asn1.type === 0x03)) {
      // However, 0x00 on its own is a valid number
      if (asn1.length > 1) {
        index += 1
        adjust = -1
      }
    }
    adjustedLen = asn1.length + adjust

    function parseChildren(eager = false) {
      asn1.children = []

      while (iters < ELOOPN && index < 2 + asn1.length + asn1.lengthSize) {
        iters += 1
        depth.length += 1
        child = parseAsn1Inner(buf.subarray(index, index + adjustedLen), depth, eager)
        depth.length -= 1
        // The numbers don't match up exactly and I don't remember why...
        // probably something with adjustedLen or some such, but the tests pass
        index += 2 + child.lengthSize + child.length

        if (index > 2 + asn1.lengthSize + asn1.length) {
          throw new Error(
            `Parse error: child value length (${child.length}) is `
            + `greater than remaining parent length (${asn1.length - index} = ${asn1.length} - ${index})`,
          )
        }
        asn1.children.push(child)
      }
      if (index !== 2 + asn1.lengthSize + asn1.length) {
        throw new Error('Unexpected EOF')
      }
      if (iters >= ELOOPN) {
        throw new Error(ELOOP)
      }

      delete asn1.value

      return asn1
    }

    // Recurse into types that are _always_ containers
    if (CTYPES[asn1.type]) {
      return parseChildren(eager)
    }

    // Return types that are _always_ values
    asn1.value = buf.subarray(index, index + adjustedLen)

    if (VTYPES[asn1.type]) {
      return asn1
    }

    // For ambiguous / unknown types, recurse and return on failure
    // (and return child array size to zero)
    try {
      return parseChildren(true)
    } catch {
      if (asn1.children) asn1.children.length = 0

      return asn1
    }
  }

  const asn1 = parseAsn1Inner(data, [])
  const len = data.length

  if (len !== 2 + asn1.lengthSize + asn1.length) {
    throw new Error('Length of buffer does not match length of ASN.1 sequence.')
  }

  return asn1
}
