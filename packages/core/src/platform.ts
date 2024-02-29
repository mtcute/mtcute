import { ITlPlatform, TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'

import { UploadFileLike } from './highlevel/types/files/utils.js'
import { MtUnsupportedError } from './types/errors.js'
import { MaybePromise } from './types/index.js'

export interface ICorePlatform extends ITlPlatform {
    beforeExit(fn: () => void): () => void
    log(color: number, level: number, tag: string, fmt: string, args: unknown[]): void
    getDefaultLogLevel(): number | null
    getDeviceModel(): string
    normalizeFile?(file: UploadFileLike): MaybePromise<{
        file?: UploadFileLike
        fileSize?: number
        fileName?: string
    } | null>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalObject: any

if (typeof globalThis !== 'undefined') {
    globalObject = globalThis
} else if (typeof global !== 'undefined') {
    globalObject = global
} else if (typeof self !== 'undefined') {
    globalObject = self
} else if (typeof window !== 'undefined') {
    globalObject = window
}

// NB: when using with some bundlers (e.g. vite) re-importing this module will not return the same object
// so we need to store the platform in a global object to be able to survive hot-reloads etc.

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
let _platform: ICorePlatform | null = globalObject?.__MTCUTE_PLATFORM__ ?? null

export function setPlatform(platform: ICorePlatform): void {
    if (_platform) {
        if (_platform.constructor !== platform.constructor) {
            throw new MtUnsupportedError('Platform may not be changed at runtime!')
        }

        return
    }

    _platform = platform
    TlBinaryReader.platform = platform
    TlBinaryWriter.platform = platform

    if (globalObject) {
        globalObject.__MTCUTE_PLATFORM__ = platform
    }
}

export function getPlatform(): ICorePlatform {
    if (!_platform) {
        throw new MtUnsupportedError('Platform is not set! Have you instantiated the client?')
    }

    return _platform
}
