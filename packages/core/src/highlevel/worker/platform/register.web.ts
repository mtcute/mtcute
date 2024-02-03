import { RespondFn, WorkerMessageHandler } from '../protocol.js'

const registered = false

export function registerWorker(handler: WorkerMessageHandler): RespondFn {
    if (registered) {
        throw new Error('registerWorker() must be called only once')
    }

    if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
        const respond: RespondFn = self.postMessage.bind(self)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        self.addEventListener('message', (message) => handler(message.data, respond))

        return respond
    }

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
        }

        return broadcast
    }

    throw new Error('registerWorker() must be called from a worker')
}
