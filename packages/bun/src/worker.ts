import type {
  ClientMessageHandler,
  RespondFn,
  SendFn,
  SomeWorker,
  TelegramWorkerOptions,
  WorkerCustomMethods,
  WorkerMessageHandler,
} from '@mtcute/core/worker.js'

import { MessagePort, parentPort, Worker } from 'node:worker_threads'
import {
  TelegramWorker as TelegramWorkerBase,
  TelegramWorkerPort as TelegramWorkerPortBase,
} from '@mtcute/core/worker.js'

import { BunPlatform } from './platform.js'

export type { TelegramWorkerOptions, WorkerCustomMethods }

export interface TelegramWorkerPortOptions {
  worker: SomeWorker
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
      platform: new BunPlatform(),
    })
  }

  connectToWorker(worker: SomeWorker, handler: ClientMessageHandler): [SendFn, () => void] {
    if (!(worker instanceof Worker) && !(worker instanceof MessagePort)) {
      throw new TypeError('Only worker_threads and MessagePorts are supported')
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
