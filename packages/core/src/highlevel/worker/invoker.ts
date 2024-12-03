import type { SendFn, WorkerInboundMessage, WorkerOutboundMessage } from './protocol.js'

import { Deferred } from '@fuman/utils'
import { deserializeError } from './errors.js'
import { deserializeResult, serializeResult } from './protocol.js'

export type InvokeTarget = Extract<WorkerInboundMessage, { type: 'invoke' }>['target']

export class WorkerInvoker {
    constructor(private send: SendFn) {}

    private _nextId = 0
    private _pending = new Map<number, Deferred<unknown>>()

    private _invoke(target: InvokeTarget, method: string, args: unknown[], isVoid: boolean, abortSignal?: AbortSignal) {
        const id = this._nextId++

        this.send({
            type: 'invoke',
            id,
            target,
            method,
            args: serializeResult(args),
            void: isVoid,
            withAbort: Boolean(abortSignal),
        })

        abortSignal?.addEventListener('abort', () => {
            this.send({
                type: 'abort',
                id,
            })
        })

        if (!isVoid) {
            const promise = new Deferred<unknown>()

            this._pending.set(id, promise)

            return promise.promise
        }
    }

    invoke(target: InvokeTarget, method: string, args: unknown[]): Promise<unknown> {
        return this._invoke(target, method, args, false) as Promise<unknown>
    }

    invokeVoid(target: InvokeTarget, method: string, args: unknown[]): void {
        // eslint-disable-next-line ts/no-floating-promises
        this._invoke(target, method, args, true)
    }

    invokeWithAbort(target: InvokeTarget, method: string, args: unknown[], abortSignal: AbortSignal): Promise<unknown> {
        if (abortSignal.aborted) return Promise.reject(abortSignal.reason)

        return this._invoke(target, method, args, false, abortSignal) as Promise<unknown>
    }

    handleResult(msg: Extract<WorkerOutboundMessage, { type: 'result' }>): void {
        const promise = this._pending.get(msg.id)
        if (!promise) return

        if (msg.error) {
            promise.reject(deserializeError(msg.error))
        } else {
            promise.resolve(deserializeResult(msg.result!))
        }
    }

    makeBinder<T>(target: InvokeTarget): <K extends keyof T>(method: K, isVoid?: boolean) => T[K] {
        return <K extends keyof T>(method: K, isVoid = false) => {
            let fn

            if (isVoid) {
                fn = (...args: unknown[]) => this.invokeVoid(target, method as string, args)
            } else {
                fn = (...args: unknown[]) => this.invoke(target, method as string, args)
            }

            return fn as T[K]
        }
    }
}
