// todo: move to platform-specific packages, add them to dev deps and remove this file

import { ITlPlatform } from './platform.js'

export const defaultTlPlatform: ITlPlatform = {
    utf8Encode: (str: string) => new TextEncoder().encode(str),
    utf8Decode: (buf: Uint8Array) => new TextDecoder().decode(buf),
    utf8ByteLength: (str: string) => new TextEncoder().encode(str).length,
}
