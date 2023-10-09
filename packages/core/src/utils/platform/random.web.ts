import { typedArrayToBuffer } from '../web-utils'

export function _randomBytes(size: number): Buffer {
    const ret = new Uint8Array(size)
    crypto.getRandomValues(ret)

    return typedArrayToBuffer(ret)
}
