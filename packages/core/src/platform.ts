import { ITlPlatform, TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'

import { MtUnsupportedError } from './types/errors.js'

export interface ICorePlatform extends ITlPlatform {
    beforeExit(fn: () => void): () => void
    log(color: number, level: number, tag: string, fmt: string, args: unknown[]): void
    getDefaultLogLevel(): number | null
    getDeviceModel(): string
}

let _platform: ICorePlatform | null = null

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
}

export function getPlatform(): ICorePlatform {
    if (!_platform) {
        throw new MtUnsupportedError('Platform is not set! Have you instantiated the client?')
    }

    return _platform
}
