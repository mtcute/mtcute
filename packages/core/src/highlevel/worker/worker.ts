import { BaseTelegramClient } from '../base.js'
import { serializeError } from './errors.js'
import { RespondFn, WorkerCustomMethods, WorkerInboundMessage, WorkerMessageHandler } from './protocol.js'

export interface TelegramWorkerOptions<T extends WorkerCustomMethods> {
    client: BaseTelegramClient
    customMethods?: T
}

export abstract class TelegramWorker<T extends WorkerCustomMethods> {
    readonly client: BaseTelegramClient
    readonly broadcast: RespondFn

    abstract registerWorker(handler: WorkerMessageHandler): RespondFn

    readonly pendingAborts = new Map<number, AbortController>()

    constructor(readonly params: TelegramWorkerOptions<T>) {
        this.broadcast = this.registerWorker((message, respond) => {
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

        const client = params.client
        this.client = client

        client.log.mgr.handler = (color, level, tag, fmt, args) =>
            this.broadcast({
                type: 'log',
                color,
                level,
                tag,
                fmt,
                args,
            })
        client.onError((err) =>
            this.broadcast({
                type: 'error',
                error: err,
            }),
        )
        client.onConnectionState((state) =>
            this.broadcast({
                type: 'conn_state',
                state,
            }),
        )
        client.stopSignal.addEventListener('abort', () => this.broadcast({ type: 'stop' }))

        if (client.updates) {
            client.onUpdate((update, peers) =>
                this.broadcast({
                    type: 'update',
                    update,
                    users: peers.users,
                    chats: peers.chats,
                    hasMin: peers.hasMin,
                }),
            )
        } else {
            client.onServerUpdate((update) =>
                this.broadcast({
                    type: 'server_update',
                    update,
                }),
            )
        }
    }

    private onInvoke(msg: Extract<WorkerInboundMessage, { type: 'invoke' }>, respond: RespondFn) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    type: 'result',
                    id: msg.id,
                    error: new Error(`Unknown target ${msg.target}`),
                })

                return
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const method = target[msg.method]

        if (!method) {
            respond({
                type: 'result',
                id: msg.id,
                error: new Error(`Method ${msg.method} not found on ${msg.target}`),
            })

            return
        }

        let args = msg.args

        if (msg.target === 'client' && msg.method === 'call' && msg.withAbort) {
            const abort = new AbortController()
            this.pendingAborts.set(msg.id, abort)

            args = [
                args[0],
                {
                    ...(args[1] as object),
                    abortSignal: abort.signal,
                },
            ]
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        Promise.resolve(method.apply(target, args))
            .then((res) => {
                if (msg.withAbort) {
                    this.pendingAborts.delete(msg.id)
                }

                if (msg.void) return

                respond({
                    type: 'result',
                    id: msg.id,
                    result: res,
                })
            })
            .catch((err) => {
                if (msg.withAbort) {
                    this.pendingAborts.delete(msg.id)
                }

                respond({
                    type: 'result',
                    id: msg.id,
                    error: serializeError(err),
                })
            })
    }
}
