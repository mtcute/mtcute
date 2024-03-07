import { setPlatform } from '@mtcute/core/platform.js'
import {
    ClientMessageHandler,
    RespondFn,
    SendFn,
    SomeWorker,
    TelegramWorker as TelegramWorkerBase,
    TelegramWorkerOptions,
    TelegramWorkerPort as TelegramWorkerPortBase,
    TelegramWorkerPortOptions,
    WorkerCustomMethods,
    WorkerMessageHandler,
} from '@mtcute/core/worker.js'

import { WebPlatform } from './platform.js'

export type { TelegramWorkerOptions, TelegramWorkerPortOptions, WorkerCustomMethods }

let _registered = false

export class TelegramWorker<T extends WorkerCustomMethods> extends TelegramWorkerBase<T> {
    registerWorker(handler: WorkerMessageHandler): RespondFn {
        if (_registered) {
            throw new Error('TelegramWorker must be created only once')
        }

        _registered = true

        if (typeof SharedWorkerGlobalScope !== 'undefined' && self instanceof SharedWorkerGlobalScope) {
            const connections: MessagePort[] = []

            const broadcast = (message: unknown) => {
                for (const port of connections) {
                    port.postMessage(message)
                }
            }

            self.onconnect = (event) => {
                const port = event.ports[0]
                connections.push(port)

                const respond = port.postMessage.bind(port)

                // not very reliable, but better than nothing
                // SharedWorker API doesn't provide a way to detect when the client closes the connection
                // so we just assume that the client is done when it sends a 'close' message
                // and keep a timeout for the case when the client closes without sending a 'close' message
                const onClose = () => {
                    port.close()
                    const idx = connections.indexOf(port)

                    if (idx >= 0) {
                        connections.splice(connections.indexOf(port), 1)
                    }
                }

                const onTimeout = () => {
                    console.warn('some connection timed out!')
                    respond({ __type__: 'timeout' })
                    onClose()
                }

                // 60s should be a reasonable timeout considering that the client should send a ping every 10s
                // so even if the browser has suspended the timers, we should still get a ping within a minute
                let timeout = setTimeout(onTimeout, 60000)

                port.addEventListener('message', (message) => {
                    if (message.data.__type__ === 'close') {
                        onClose()

                        return
                    }

                    if (message.data.__type__ === 'ping') {
                        clearTimeout(timeout)
                        timeout = setTimeout(onTimeout, 60000)

                        return
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    handler(message.data, respond)
                })
                port.start()
            }

            return broadcast
        }

        if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
            const respond: RespondFn = self.postMessage.bind(self)

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            self.addEventListener('message', (message) => handler(message.data, respond))

            return respond
        }

        throw new Error('TelegramWorker must be created from a worker')
    }
}

const platform = new WebPlatform()

export class TelegramWorkerPort<T extends WorkerCustomMethods> extends TelegramWorkerPortBase<T> {
    constructor(readonly options: TelegramWorkerPortOptions) {
        setPlatform(platform)
        super(options)
    }

    connectToWorker(worker: SomeWorker, handler: ClientMessageHandler): [SendFn, () => void] {
        if (worker instanceof Worker) {
            const send: SendFn = worker.postMessage.bind(worker)

            const messageHandler = (ev: MessageEvent) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                handler(ev.data)
            }

            worker.addEventListener('message', messageHandler)

            return [
                send,
                () => {
                    worker.removeEventListener('message', messageHandler)
                },
            ]
        }

        if (worker instanceof SharedWorker) {
            const send: SendFn = worker.port.postMessage.bind(worker.port)

            const pingInterval = setInterval(() => {
                worker.port.postMessage({ __type__: 'ping' })
            }, 10000)

            const messageHandler = (ev: MessageEvent) => {
                if (ev.data.__type__ === 'timeout') {
                    // we got disconnected from the worker due to timeout
                    // if the page is still alive (which is unlikely), we should reconnect
                    // however it's not really possible with SharedWorker API without re-creating the worker
                    // so we just reload the page for now
                    location.reload()

                    return
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                handler(ev.data)
            }

            worker.port.addEventListener('message', messageHandler)
            worker.port.start()

            // eslint-disable-next-line prefer-const
            let cancelBeforeExit: () => void

            const close = () => {
                clearInterval(pingInterval)
                worker.port.postMessage({ __type__: 'close' })
                worker.port.removeEventListener('message', messageHandler)
                worker.port.close()
                cancelBeforeExit()
            }

            cancelBeforeExit = platform.beforeExit(close)

            return [send, close]
        }

        throw new Error('Only workers and shared workers are supported')
    }
}
