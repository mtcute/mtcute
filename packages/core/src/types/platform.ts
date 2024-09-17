import type { UploadFileLike } from '../highlevel/types/files/utils.js'

import type { MaybePromise } from './index.js'

export interface ICorePlatform {
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
