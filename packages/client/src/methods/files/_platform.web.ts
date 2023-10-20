import { MtArgumentError } from '@mtcute/core'

/** @internal */
export function _createFileStream(): never {
    throw new MtArgumentError('Cannot create file stream on web platform')
}

/** @internal */
export function _isFileStream() {
    return false
}

/** @internal */
export function _extractFileStreamMeta(): never {
    throw new Error('UNREACHABLE')
}

/** @internal */
export function _handleNodeStream(val: unknown) {
    return val
}

// all the above functions shall be inlined by terser
