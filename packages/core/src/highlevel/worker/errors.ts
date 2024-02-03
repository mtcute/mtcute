import { tl } from '@mtcute/tl'

import {
    MtArgumentError,
    MtcuteError,
    MtSecurityError,
    MtTimeoutError,
    MtTypeAssertionError,
    MtUnsupportedError,
} from '../../types/errors.js'
import { MtEmptyError, MtInvalidPeerTypeError, MtMessageNotFoundError, MtPeerNotFoundError } from '../types/errors.js'

export interface SerializedError {
    name: string
    message: string
    stack?: string
    custom?: Record<string, unknown>
}

export function serializeError(error: unknown): SerializedError {
    if (!(error instanceof Error)) return { name: 'Error', message: String(error) }

    const res: SerializedError = {
        name: 'Error',
        message: error.message,
        stack: error.stack,
    }

    const ctor = error.constructor

    if (ctor === MtTypeAssertionError) {
        const _error = error as MtTypeAssertionError
        res.name = 'MtTypeAssertionError'
        res.custom = {
            context: _error.context,
            expected: _error.expected,
            actual: _error.actual,
        }
    } else if (ctor === MtTimeoutError) {
        const _error = error as MtTimeoutError
        res.name = 'MtTimeoutError'
        res.custom = {
            timeout: _error.timeout,
        }
    } else if (ctor === MtMessageNotFoundError) {
        const _error = error as MtMessageNotFoundError
        res.name = 'MtMessageNotFoundError'
        res.custom = {
            peerId: _error.peerId,
            messageId: _error.messageId,
            context: _error.context,
        }
    } else if (ctor === tl.RpcError) {
        res.name = 'RpcError'
        res.custom = { ...error }
    } else if (ctor === MtArgumentError) res.name = 'MtArgumentError'
    else if (ctor === MtSecurityError) res.name = 'MtSecurityError'
    else if (ctor === MtUnsupportedError) res.name = 'MtUnsupportedError'
    else if (ctor === MtPeerNotFoundError) res.name = 'MtPeerNotFoundError'
    else if (ctor === MtInvalidPeerTypeError) res.name = 'MtInvalidPeerTypeError'
    else if (ctor === MtEmptyError) res.name = 'MtEmptyError'
    else if (ctor instanceof MtcuteError) res.name = 'MtcuteError'

    return res
}

export function deserializeError(error: SerializedError): Error {
    let err2: Error

    switch (error.name) {
        case 'MtTypeAssertionError': {
            const custom = error.custom as { context: string; expected: string; actual: string }

            err2 = new MtTypeAssertionError(custom.context, custom.expected, custom.actual)
            break
        }
        case 'MtTimeoutError': {
            const custom = error.custom as { timeout?: number }

            err2 = new MtTimeoutError(custom.timeout)
            break
        }
        case 'MtMessageNotFoundError': {
            const custom = error.custom as { peerId: number; messageId: number; context?: string }

            err2 = new MtMessageNotFoundError(custom.peerId, custom.messageId, custom.context)
            break
        }
        case 'RpcError': {
            const custom = error.custom as unknown as tl.RpcError
            err2 = new tl.RpcError(custom.code, custom.text)
            err2.message = error.message // may have been formatted

            for (const key in custom) {
                if (key === 'code' || key === 'text') continue
                // @ts-expect-error lol
                err2[key] = custom[key] // eslint-disable-line
            }
            break
        }
        case 'MtArgumentError':
            err2 = new MtArgumentError()
            break
        case 'MtSecurityError':
            err2 = new MtSecurityError()
            break
        case 'MtUnsupportedError':
            err2 = new MtUnsupportedError()
            break
        case 'MtPeerNotFoundError':
            err2 = new MtPeerNotFoundError()
            break
        case 'MtInvalidPeerTypeError':
            err2 = new MtInvalidPeerTypeError('', '')
            err2.message = error.message // lol
            break
        case 'MtEmptyError':
            err2 = new MtEmptyError()
            break
        case 'MtcuteError':
            err2 = new MtcuteError()
            break
        default:
            err2 = new Error(error.message)
    }

    err2.stack = error.stack

    return err2
}
