/// Based on https://github.com/feross/buffer, MIT license

const hexSliceLookupTable = (function () {
    const alphabet = '0123456789abcdef'
    const table: string[] = Array.from({ length: 256 })

    for (let i = 0; i < 16; ++i) {
        const i16 = i * 16

        for (let j = 0; j < 16; ++j) {
            table[i16 + j] = alphabet[i] + alphabet[j]
        }
    }

    return table
})()

const hexCharValueTable: Record<string, number> = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
}

export function hexEncode(buf: Uint8Array): string {
    let out = ''

    for (let i = 0; i < buf.byteLength; ++i) {
        out += hexSliceLookupTable[buf[i]]
    }

    return out
}

function hexDecodeInner(buf: Uint8Array, string: string): void {
    const strLen = string.length
    const length = Math.min(buf.length, strLen / 2)

    let i

    for (i = 0; i < length; ++i) {
        const a = hexCharValueTable[string[i * 2]]
        const b = hexCharValueTable[string[i * 2 + 1]]

        if (a === undefined || b === undefined) {
            return
        }
        buf[i] = (a << 4) | b
    }
}

export function hexDecode(string: string): Uint8Array {
    const buf = new Uint8Array(Math.ceil(string.length / 2))
    hexDecodeInner(buf, string)

    return buf
}
