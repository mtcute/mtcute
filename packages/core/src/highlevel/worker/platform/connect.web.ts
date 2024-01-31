import { beforeExit } from '../../../utils/platform/exit-hook.js'
import { ClientMessageHandler, SendFn, SomeWorker } from '../protocol.js'

export function connectToWorker(worker: SomeWorker, handler: ClientMessageHandler): [SendFn, () => void] {
    if (worker instanceof Worker) {
        const send: SendFn = worker.postMessage.bind(worker)

        const messageHandler = (ev: MessageEvent) => {
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

            handler(ev.data)
        }

        worker.port.addEventListener('message', messageHandler)
        worker.port.start()

        const close = () => {
            clearInterval(pingInterval)
            worker.port.postMessage({ __type__: 'close' })
            worker.port.removeEventListener('message', messageHandler)
            worker.port.close()
        }

        beforeExit(close)

        return [send, close]
    }

    throw new Error('Only workers and shared workers are supported')
}
