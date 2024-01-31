import { BaseTelegramClient, BaseTelegramClientOptions } from '../base.js'
import { serializeError } from './errors.js'
import { registerWorker } from './platform/register.js'
import { RespondFn, WorkerCustomMethods, WorkerInboundMessage, WorkerMessageHandler } from './protocol.js'

export interface TelegramWorkerOptions<T extends WorkerCustomMethods> {
    client: BaseTelegramClient | BaseTelegramClientOptions
    customMethods?: T
}

export function makeTelegramWorker<T extends WorkerCustomMethods>(params: TelegramWorkerOptions<T>) {
    const { client: client_, customMethods } = params

    const client = client_ instanceof BaseTelegramClient ? client_ : new BaseTelegramClient(client_)

    const onInvoke = (msg: Extract<WorkerInboundMessage, { type: 'invoke' }>, respond: RespondFn) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let target: any

        switch (msg.target) {
            case 'custom':
                target = customMethods
                break
            case 'client':
                target = client
                break
            case 'storage':
                target = client.storage
                break
            case 'storage-self':
                target = client.storage.self
                break
            case 'storage-peers':
                target = client.storage.peers
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

        const method = target[msg.method]

        if (!method) {
            respond({
                type: 'result',
                id: msg.id,
                error: new Error(`Method ${msg.method} not found on ${msg.target}`),
            })

            return
        }

        Promise.resolve(method.apply(target, msg.args))
            .then((res) => {
                if (msg.void) return

                respond({
                    type: 'result',
                    id: msg.id,
                    result: res,
                })
            })
            .catch((err) => {
                respond({
                    type: 'result',
                    id: msg.id,
                    error: serializeError(err),
                })
            })
    }

    const onMessage: WorkerMessageHandler = (message, respond) => {
        switch (message.type) {
            case 'invoke':
                onInvoke(message, respond)
                break
        }
    }

    const broadcast = registerWorker(onMessage)

    client.log.mgr.handler = (color, level, tag, fmt, args) =>
        broadcast({
            type: 'log',
            color,
            level,
            tag,
            fmt,
            args,
        })
    client.onError((err) =>
        broadcast({
            type: 'error',
            error: err,
        }),
    )

    if (client.updates) {
        client.onUpdate((update, peers) =>
            broadcast({
                type: 'update',
                update,
                users: peers.users,
                chats: peers.chats,
                hasMin: peers.hasMin,
            }),
        )
    } else {
        client.onServerUpdate((update) =>
            broadcast({
                type: 'server_update',
                update,
            }),
        )
    }
}
