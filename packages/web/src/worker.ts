/* eslint-disable ts/no-unsafe-assignment */
import type {
  ClientMessageHandler,
  RespondFn,
  SendFn,
  SomeWorker,
  TelegramWorkerOptions,
  WorkerCustomMethods,
  WorkerInboundMessage,
  WorkerMessageHandler,
} from '@mtcute/core/worker.js'
import { unsafeCastType } from '@fuman/utils'

import {
  TelegramWorker as TelegramWorkerBase,
  TelegramWorkerPort as TelegramWorkerPortBase,
} from '@mtcute/core/worker.js'
import { WebPlatform } from './platform.js'

export type { TelegramWorkerOptions, WorkerCustomMethods }
export interface TelegramWorkerPortOptions {
  worker: SomeWorker
  workerId?: string
}

// <deno-insert>
// declare const WorkerGlobalScope: any
// declare const self: typeof globalThis & {
//   postMessage: Function,
//   addEventListener: (type: 'message', listener: (ev: MessageEvent) => void) => void,
// }
// </deno-insert>

let _broadcast: RespondFn | undefined
const _sharedHandlers = new Set<WorkerMessageHandler>()

// <deno-remove>
function isWorkerInboundMessage(message: unknown): message is WorkerInboundMessage {
  if (!message || typeof message !== 'object') return false

  const data = message as Partial<WorkerInboundMessage>
  if (typeof data._mtcuteWorkerId !== 'string') return false
  if (typeof data.connectionId !== 'string') return false
  return true
}

function setupSharedWorker(): RespondFn {
  if (_broadcast) return _broadcast
  unsafeCastType<SharedWorkerGlobalScope>(self)

  const ports = new Map<string, MessagePort>()
  const knownConnectionIds = new WeakMap<MessagePort, Set<string>>()
  const addConnection = (port: MessagePort, connectionId: string) => {
    ports.set(connectionId, port)

    const known = knownConnectionIds.get(port)
    if (known) {
      known.add(connectionId)
      return
    }

    knownConnectionIds.set(port, new Set([connectionId]))
  }
  const cleanupConnection = (port: MessagePort, connectionId: string) => {
    ports.delete(connectionId)

    const known = knownConnectionIds.get(port)
    if (!known) return

    known.delete(connectionId)
    if (!known.size) {
      knownConnectionIds.delete(port)
    }
  }

  const broadcast: RespondFn = (message) => {
    if ('connectionId' in message) {
      const port = ports.get(message.connectionId)
      if (!port) return

      port.postMessage(message)

      if (message.type === 'connection_expired') {
        cleanupConnection(port, message.connectionId)
      }

      return
    }

    for (const port of ports.values()) {
      port.postMessage(message)
    }
  }

  self.onconnect = (event: MessageEvent) => {
    const port = event.ports[0]
    const respond: RespondFn = (message) => {
      port.postMessage(message)

      if ('connectionId' in message && message.type === 'connection_expired') {
        cleanupConnection(port, message.connectionId)
      }
    }

    port.addEventListener('message', (message) => {
      const data = message.data
      if (!isWorkerInboundMessage(data)) return

      if (data.type === 'connect') {
        addConnection(port, data.connectionId)
      } else if (data.type === 'release') {
        cleanupConnection(port, data.connectionId)
      }

      for (const handler of _sharedHandlers) {
        handler(data, respond)
      }
    })
    port.start()
  }

  _broadcast = broadcast
  return broadcast
}
// </deno-remove>

export class TelegramWorker<T extends WorkerCustomMethods> extends TelegramWorkerBase<T> {
  registerWorker(handler: WorkerMessageHandler): [RespondFn, VoidFunction] {
    // <deno-remove>
    if (typeof SharedWorkerGlobalScope !== 'undefined' && self instanceof SharedWorkerGlobalScope) {
      const broadcast = setupSharedWorker()
      _sharedHandlers.add(handler)
      return [broadcast, () => _sharedHandlers.delete(handler)]
    }
    // </deno-remove>

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

const platform = /* #__PURE__ */ new WebPlatform()

export class TelegramWorkerPort<T extends WorkerCustomMethods> extends TelegramWorkerPortBase<T> {
  constructor(options: TelegramWorkerPortOptions) {
    super({
      worker: options.worker,
      workerId: options.workerId,
      platform,
    })
  }

  connectToWorker(worker: SomeWorker, handler: ClientMessageHandler): [SendFn, () => void] {
    if (worker instanceof Worker || worker instanceof MessagePort) {
      const send: SendFn = worker.postMessage.bind(worker)

      // eslint-disable-next-line ts/no-unsafe-argument
      const messageHandler = (ev: MessageEvent) => handler(ev.data)

      worker.addEventListener('message', messageHandler as EventListener)
      if (worker instanceof MessagePort) worker.start()

      return [
        send,
        () => {
          worker.removeEventListener('message', messageHandler as EventListener)
        },
      ]
    }

    // <deno-remove>
    if (worker instanceof SharedWorker) {
      const send: SendFn = worker.port.postMessage.bind(worker.port)

      const messageHandler = (ev: MessageEvent) => {
        // eslint-disable-next-line ts/no-unsafe-argument
        handler(ev.data)
      }

      worker.port.addEventListener('message', messageHandler)
      worker.port.start()

      const close = () => {
        worker.port.removeEventListener('message', messageHandler)
      }

      return [send, close]
    }
    // </deno-remove>

    throw new Error('Only workers and shared workers are supported')
  }
}
