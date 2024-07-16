import { RpcCallMiddleware } from '../network-manager.js'
import { floodWaiter, FloodWaiterOptions } from './flood-waiter.js'
import { internalErrorsHandler, InternalErrorsHandlerOptions } from './internal-errors.js'

export interface BasicMiddlewaresOptions {
    floodWaiter?: FloodWaiterOptions
    internalErrors?: InternalErrorsHandlerOptions
}

export const basic = (options?: BasicMiddlewaresOptions): RpcCallMiddleware[] => {
    return [floodWaiter(options?.floodWaiter ?? {}), internalErrorsHandler(options?.internalErrors ?? {})]
}
