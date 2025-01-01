import type {
    ClientMessageHandler,
    RespondFn,
    SendFn,
    SomeWorker,
    TelegramWorkerOptions,
    WorkerCustomMethods,
    WorkerMessageHandler,
} from '@mtcute/core/worker.js'
import {
    TelegramWorker as TelegramWorkerBase,
    TelegramWorkerPort as TelegramWorkerPortBase,
} from '@mtcute/core/worker.js'

import { DenoPlatform } from './platform.js'

// <deno-insert>
// declare const WorkerGlobalScope: any
// declare const self: typeof globalThis & {
//   postMessage: Function,
//   addEventListener: (type: 'message', listener: (ev: { data: any }) => void) => void,
// }
// </deno-insert>

export type { TelegramWorkerOptions, WorkerCustomMethods }
export interface TelegramWorkerPortOptions {
    worker: SomeWorker
}
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
            self.addEventListener('message', (message) => handler(message.data, respond))

            return respond
        }

        throw new Error('TelegramWorker must be created from a worker')
    }
}

const platform = new DenoPlatform()

export class TelegramWorkerPort<T extends WorkerCustomMethods> extends TelegramWorkerPortBase<T> {
    constructor(options: TelegramWorkerPortOptions) {
        super({
            worker: options.worker,
            platform,
        })
    }

    connectToWorker(worker: SomeWorker, handler: ClientMessageHandler): [SendFn, () => void] {
        if (worker instanceof Worker) {
            const send: SendFn = worker.postMessage.bind(worker)

            const messageHandler = (ev: MessageEvent) => {
                // eslint-disable-next-line ts/no-unsafe-argument
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
