import type {
    ClientMessageHandler,
    RespondFn,
    SendFn,
    SomeWorker,
    TelegramWorkerOptions,
    WorkerCustomMethods,
    WorkerMessageHandler,
} from '@mtcute/core/worker.js'

import { parentPort, Worker } from 'node:worker_threads'
import {
    TelegramWorker as TelegramWorkerBase,
    TelegramWorkerPort as TelegramWorkerPortBase,
} from '@mtcute/core/worker.js'

import { NodePlatform } from './utils/platform.js'

export type { TelegramWorkerOptions, WorkerCustomMethods }

export interface TelegramWorkerPortOptions {
    worker: SomeWorker
    workerId?: string
}

export class TelegramWorker<T extends WorkerCustomMethods> extends TelegramWorkerBase<T> {
    registerWorker(handler: WorkerMessageHandler): [RespondFn, VoidFunction] {
        if (!parentPort) {
            throw new Error('TelegramWorker must be created from a worker thread')
        }

        const port = parentPort

        const respond: RespondFn = port.postMessage.bind(port)

        // eslint-disable-next-line ts/no-unsafe-argument
        const messageHandler = (message: any) => handler(message, respond)
        port.on('message', messageHandler)

        return [respond, () => port.off('message', messageHandler)]
    }
}

export class TelegramWorkerPort<T extends WorkerCustomMethods> extends TelegramWorkerPortBase<T> {
    constructor(options: TelegramWorkerPortOptions) {
        super({
            worker: options.worker,
            workerId: options.workerId,
            platform: new NodePlatform(),
        })
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
