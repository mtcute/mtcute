export function _randomBytes(size: number): Uint8Array {
    const ret = new Uint8Array(size)
    crypto.getRandomValues(ret)

    return ret
}
