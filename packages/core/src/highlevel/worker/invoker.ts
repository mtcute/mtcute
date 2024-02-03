import { ControllablePromise, createControllablePromise } from '../../utils/controllable-promise.js'
import { deserializeError } from './errors.js'
import { SendFn, WorkerInboundMessage, WorkerOutboundMessage } from './protocol.js'

export type InvokeTarget = Extract<WorkerInboundMessage, { type: 'invoke' }>['target']

export class WorkerInvoker {
    constructor(private send: SendFn) {}

    private _nextId = 0
    private _pending = new Map<number, ControllablePromise>()

    private _invoke(target: InvokeTarget, method: string, args: unknown[], isVoid: boolean) {
        const id = this._nextId++

        this.send({
            type: 'invoke',
            id,
            target,
            method,
            args,
            void: isVoid,
        })

        if (!isVoid) {
            const promise = createControllablePromise()

            this._pending.set(id, promise)

            return promise
        }
    }

    invoke(target: InvokeTarget, method: string, args: unknown[]): Promise<unknown> {
        return this._invoke(target, method, args, false) as Promise<unknown>
    }

    invokeVoid(target: InvokeTarget, method: string, args: unknown[]): void {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._invoke(target, method, args, true)
    }

    handleResult(msg: Extract<WorkerOutboundMessage, { type: 'result' }>) {
        const promise = this._pending.get(msg.id)
        if (!promise) return

        if (msg.error) {
            promise.reject(deserializeError(msg.error))
        } else {
            promise.resolve(msg.result)
        }
    }

    makeBinder<T>(target: InvokeTarget) {
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
