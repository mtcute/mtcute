import type { Worker as NodeWorker } from 'node:worker_threads'

import { tl } from '@mtcute/tl'

import { ConnectionState } from '../client.types.js'
import { SerializedError } from './errors.js'

export type WorkerInboundMessage = {
    type: 'invoke'
    id: number
    target: 'custom' | 'client' | 'storage' | 'storage-self' | 'storage-peers' | 'app-config'
    method: string
    args: unknown[]
    void: boolean
}

export type WorkerOutboundMessage =
    | { type: 'server_update'; update: tl.TypeUpdates }
    | {
          type: 'update'
          update: tl.TypeUpdate
          users: Map<number, tl.TypeUser>
          chats: Map<number, tl.TypeChat>
          hasMin: boolean
      }
    | { type: 'error'; error: unknown }
    | { type: 'stop' }
    | { type: 'conn_state'; state: ConnectionState }
    | {
          type: 'log'
          color: number
          level: number
          tag: string
          fmt: string
          args: unknown[]
      }
    | {
          type: 'result'
          id: number
          result?: unknown
          error?: SerializedError
      }

export type SomeWorker = NodeWorker | Worker | SharedWorker

export type SendFn = (message: WorkerInboundMessage) => void
export type ClientMessageHandler = (message: WorkerOutboundMessage) => void

export type RespondFn = (message: WorkerOutboundMessage) => void
export type WorkerMessageHandler = (message: WorkerInboundMessage, respond: RespondFn) => void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WorkerCustomMethods = Record<string, (...args: any[]) => Promise<any>>
