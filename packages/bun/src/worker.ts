import { Worker, parentPort } from 'node:worker_threads'

import { setPlatform } from '@mtcute/core/platform.js'
import type {
    ClientMessageHandler,
    RespondFn,
    SendFn,
    SomeWorker,
    TelegramWorkerOptions,
    TelegramWorkerPortOptions,
    WorkerCustomMethods,
    WorkerMessageHandler,
} from '@mtcute/core/worker.js'
import {
    TelegramWorker as TelegramWorkerBase,
    TelegramWorkerPort as TelegramWorkerPortBase,
} from '@mtcute/core/worker.js'

import { BunPlatform } from './platform.js'

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

        // eslint-disable-next-line ts/no-unsafe-argument
        parentPort.on('message', message => handler(message, respond))

        return respond
    }
}

export class TelegramWorkerPort<T extends WorkerCustomMethods> extends TelegramWorkerPortBase<T> {
    constructor(readonly options: TelegramWorkerPortOptions) {
        setPlatform(new BunPlatform())
        super(options)
    }

    connectToWorker(worker: SomeWorker, handler: ClientMessageHandler): [SendFn, () => void] {
        if (!(worker instanceof Worker)) {
            throw new TypeError('Only worker_threads are supported')
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
