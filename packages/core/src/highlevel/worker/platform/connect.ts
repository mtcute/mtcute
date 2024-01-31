import { Worker } from 'worker_threads'

import { ClientMessageHandler, SendFn, SomeWorker } from '../protocol.js'

export function connectToWorker(worker: SomeWorker, handler: ClientMessageHandler): [SendFn, () => void] {
    if (!(worker instanceof Worker)) {
        throw new Error('Only worker_threads are supported')
    }

    const send: SendFn = worker.postMessage.bind(worker)

    worker.on('message', handler)

    return [
        send,
        () => {
            worker.off('message', handler)
        },
    ]
}
