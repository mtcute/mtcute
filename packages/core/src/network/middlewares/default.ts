import type { RpcCallMiddleware } from '../network-manager.js'

import type { FloodWaiterOptions } from './flood-waiter.js'
import type { InternalErrorsHandlerOptions } from './internal-errors.js'
import { floodWaiter } from './flood-waiter.js'
import { internalErrorsHandler } from './internal-errors.js'

export interface BasicMiddlewaresOptions {
    floodWaiter?: FloodWaiterOptions
    internalErrors?: InternalErrorsHandlerOptions
}

export function basic(options?: BasicMiddlewaresOptions): RpcCallMiddleware[] {
    return [floodWaiter(options?.floodWaiter ?? {}), internalErrorsHandler(options?.internalErrors ?? {})]
}
