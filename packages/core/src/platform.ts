import type { ITlPlatform } from '@mtcute/tl-runtime'
import { TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'

import type { UploadFileLike } from './highlevel/types/files/utils.js'
import { MtUnsupportedError } from './types/errors.js'
import type { MaybePromise } from './types/index.js'

export interface ICorePlatform extends ITlPlatform {
    beforeExit: (fn: () => void) => () => void
    log: (color: number, level: number, tag: string, fmt: string, args: unknown[]) => void
    getDefaultLogLevel: () => number | null
    getDeviceModel: () => string
    normalizeFile?: (file: UploadFileLike) => MaybePromise<{
        file?: UploadFileLike
        fileSize?: number
        fileName?: string
    } | null>
    onNetworkChanged?: (fn: (connected: boolean) => void) => () => void
    isOnline?: () => boolean
}

// NB: when using with some bundlers (e.g. vite) re-importing this module will not return the same object
// so we need to store the platform in a global object to be able to survive hot-reloads etc.
// try to use Symbol if available, otherwise fallback to a string
const platformKey = typeof Symbol !== 'undefined' ? Symbol.for('mtcute.platform') : '__MTCUTE_PLATFORM__'

// eslint-disable-next-line
let _platform: ICorePlatform | null = (globalThis as any)?.[platformKey] ?? null

export function setPlatform(platform: ICorePlatform): void {
    let finalPlatform = platform

    if (_platform) {
        if (_platform.name !== platform.name) {
            throw new MtUnsupportedError('Platform may not be changed at runtime!')
        }

        finalPlatform = _platform
    }

    _platform = finalPlatform
    TlBinaryReader.platform = finalPlatform
    TlBinaryWriter.platform = finalPlatform

    ;(globalThis as any)[platformKey] = finalPlatform
}

export function getPlatform(): ICorePlatform {
    if (!_platform) {
        throw new MtUnsupportedError('Platform is not set! Have you instantiated the client?')
    }

    return _platform
}
