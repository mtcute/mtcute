import { parentPort, Worker } from 'worker_threads'

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
        if (!parentPort) {
            throw new Error('TelegramWorker must be created from a worker thread')
        }
        if (_registered) {
            throw new Error('TelegramWorker must be created only once')
        }

        _registered = true

        const port = parentPort

        const respond: RespondFn = port.postMessage.bind(port)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        parentPort.on('message', (message) => handler(message, respond))

        return respond
    }
}

export class TelegramWorkerPort<T extends WorkerCustomMethods> extends TelegramWorkerPortBase<T> {
    constructor(readonly options: TelegramWorkerPortOptions) {
        setPlatform(new WebPlatform())
        super(options)
    }

    connectToWorker(worker: SomeWorker, handler: ClientMessageHandler): [SendFn, () => void] {
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
}
