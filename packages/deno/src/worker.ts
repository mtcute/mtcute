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
    workerId?: string
}

export class TelegramWorker<T extends WorkerCustomMethods> extends TelegramWorkerBase<T> {
    registerWorker(handler: WorkerMessageHandler): [RespondFn, VoidFunction] {
        if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
            const respond: RespondFn = self.postMessage.bind(self)

            // eslint-disable-next-line ts/no-unsafe-argument
            const messageHandler = (message: MessageEvent) => handler(message.data, respond)
            // eslint-disable-next-line ts/no-unsafe-argument
            self.addEventListener('message', messageHandler as any)

            // eslint-disable-next-line ts/no-unsafe-argument
            return [respond, () => self.removeEventListener('message', messageHandler as any)]
        }

        throw new Error('TelegramWorker must be created from a worker')
    }
}

const platform = new DenoPlatform()

export class TelegramWorkerPort<T extends WorkerCustomMethods> extends TelegramWorkerPortBase<T> {
    constructor(options: TelegramWorkerPortOptions) {
        super({
            worker: options.worker,
            workerId: options.workerId,
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
