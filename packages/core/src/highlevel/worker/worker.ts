import type { BaseTelegramClient } from '../base.js'

import type {
    RespondFn,
    SerializedResult,
    WorkerCustomMethods,
    WorkerInboundMessage,
    WorkerMessageHandler,
} from './protocol.js'
import { serializeError } from './errors.js'
import {
    DEFAULT_WORKER_ID,
    deserializeResult,
    serializeResult,
} from './protocol.js'

export interface TelegramWorkerOptions<T extends WorkerCustomMethods> {
    client: BaseTelegramClient
    workerId?: string
    customMethods?: T
}

export abstract class TelegramWorker<T extends WorkerCustomMethods> {
    readonly client: BaseTelegramClient
    readonly broadcast: RespondFn
    private _cleanup: VoidFunction | undefined

    abstract registerWorker(handler: WorkerMessageHandler): [RespondFn, VoidFunction]

    readonly pendingAborts: Map<number, AbortController> = new Map()
    readonly workerId: string

    constructor(readonly params: TelegramWorkerOptions<T>) {
        this.workerId = params.workerId ?? DEFAULT_WORKER_ID

        const [broadcast, cleanup] = this.registerWorker((message, respond) => {
            if (message._mtcuteWorkerId !== this.workerId) return

            switch (message.type) {
                case 'invoke':
                    this.onInvoke(message, respond)
                    break
                case 'abort': {
                    const abort = this.pendingAborts.get(message.id)

                    if (abort) {
                        abort.abort()
                        this.pendingAborts.delete(message.id)
                    }
                }
            }
        })

        this.broadcast = broadcast
        this._cleanup = cleanup

        const client = params.client
        this.client = client

        client.log.mgr.handler = (color, level, tag, fmt, args) =>
            this.broadcast({
                _mtcuteWorkerId: this.workerId,
                type: 'log',
                color,
                level,
                tag,
                fmt,
                args,
            })
        client.onError.add(err =>
            this.broadcast({
                _mtcuteWorkerId: this.workerId,
                type: 'error',
                error: serializeError(err),
            }),
        )
        client.onConnectionState.add(state =>
            this.broadcast({
                _mtcuteWorkerId: this.workerId,
                type: 'conn_state',
                state,
            }),
        )
        client.stopSignal.addEventListener('abort', () => this.broadcast({
            _mtcuteWorkerId: this.workerId,
            type: 'stop',
        }))

        if (client.updates) {
            client.onRawUpdate.add(({ update, peers }) =>
                this.broadcast({
                    _mtcuteWorkerId: this.workerId,
                    type: 'update',
                    update: serializeResult(update),
                    users: serializeResult(peers.users),
                    chats: serializeResult(peers.chats),
                    hasMin: peers.hasMin,
                }),
            )
        } else {
            client.onServerUpdate.add(update =>
                this.broadcast({
                    _mtcuteWorkerId: this.workerId,
                    type: 'server_update',
                    update: serializeResult(update),
                }),
            )
        }
    }

    private onInvoke(msg: Extract<WorkerInboundMessage, { type: 'invoke' }>, respond: RespondFn) {
        let target: any

        switch (msg.target) {
            case 'custom':
                target = this.params.customMethods
                break
            case 'client':
                target = this.client
                break
            case 'storage':
                target = this.client.storage
                break
            case 'storage-self':
                target = this.client.storage.self
                break
            case 'storage-peers':
                target = this.client.storage.peers
                break
            case 'app-config':
                target = this.client.appConfig
                break

            default: {
                respond({
                    _mtcuteWorkerId: this.workerId,
                    type: 'result',
                    id: msg.id,
                    error: new Error(`Unknown target ${msg.target}`),
                })

                return
            }
        }

        // eslint-disable-next-line ts/no-unsafe-assignment
        const method = target[msg.method]

        if (!method) {
            respond({
                _mtcuteWorkerId: this.workerId,
                type: 'result',
                id: msg.id,
                error: new Error(`Method ${msg.method} not found on ${msg.target}`),
            })

            return
        }

        let args: unknown[]

        if (msg.target === 'client' && msg.method === 'call' && msg.withAbort) {
            const abort = new AbortController()
            this.pendingAborts.set(msg.id, abort)

            args = [
                deserializeResult((msg.args as unknown as unknown[])[0] as SerializedResult<unknown>),
                {
                    ...((msg.args as unknown as unknown[])[1] as object),
                    abortSignal: abort.signal,
                },
            ]
        } else {
            args = deserializeResult(msg.args)
        }

        // eslint-disable-next-line ts/no-unsafe-call
        Promise.resolve(method.apply(target, args))
            .then((res) => {
                if (msg.withAbort) {
                    this.pendingAborts.delete(msg.id)
                }

                if (msg.void) return

                respond({
                    _mtcuteWorkerId: this.workerId,
                    type: 'result',
                    id: msg.id,
                    result: serializeResult(res),
                })
            })
            .catch((err) => {
                if (msg.withAbort) {
                    this.pendingAborts.delete(msg.id)
                }

                respond({
                    _mtcuteWorkerId: this.workerId,
                    type: 'result',
                    id: msg.id,
                    error: serializeError(err),
                })
            })
    }

    destroy(): void {
        this._cleanup?.()
    }
}
