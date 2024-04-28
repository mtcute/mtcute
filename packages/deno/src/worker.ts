/// <reference lib="WebWorker" />
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

import { DenoPlatform } from './platform.js'

export type { TelegramWorkerOptions, TelegramWorkerPortOptions, WorkerCustomMethods }

let _registered = false

export class TelegramWorker<T extends WorkerCustomMethods> extends TelegramWorkerBase<T> {
    registerWorker(handler: WorkerMessageHandler): RespondFn {
        if (_registered) {
            throw new Error('TelegramWorker must be created only once')
        }

        _registered = true

        if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
            const respond: RespondFn = self.postMessage.bind(self)

            // eslint-disable-next-line
            self.addEventListener('message', (message) => handler((message as any).data, respond))

            return respond
        }

        throw new Error('TelegramWorker must be created from a worker')
    }
}

const platform = new DenoPlatform()

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
        throw new Error('Only workers are supported')
    }
}
