import { parentPort } from 'worker_threads'

import { RespondFn, WorkerMessageHandler } from '../protocol.js'

const registered = false

export function registerWorker(handler: WorkerMessageHandler): RespondFn {
    if (!parentPort) {
        throw new Error('registerWorker() must be called from a worker thread')
    }
    if (registered) {
        throw new Error('registerWorker() must be called only once')
    }

    const port = parentPort

    const respond: RespondFn = port.postMessage.bind(port)

    parentPort.on('message', (message) => handler(message, respond))

    return respond
}
