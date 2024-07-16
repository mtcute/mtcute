import Long from 'long'
import type { Worker as NodeWorker } from 'node:worker_threads'

import { tl } from '@mtcute/tl'

import { ConnectionState } from '../client.types.js'
import { SerializedError } from './errors.js'

export type WorkerInboundMessage =
    | {
          type: 'invoke'
          id: number
          target: 'custom' | 'client' | 'storage' | 'storage-self' | 'storage-peers' | 'app-config'
          method: string
          args: unknown[]
          void: boolean
          withAbort: boolean
      }
    | {
          type: 'abort'
          id: number
      }

export type WorkerOutboundMessage =
    | { type: 'server_update'; update: SerializedResult<tl.TypeUpdates> }
    | {
          type: 'update'
          update: SerializedResult<tl.TypeUpdate>
          users: SerializedResult<Map<number, tl.TypeUser>>
          chats: SerializedResult<Map<number, tl.TypeChat>>
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
          result?: SerializedResult<unknown>
          error?: SerializedError
      }

export type SomeWorker = NodeWorker | Worker | SharedWorker

export type SendFn = (message: WorkerInboundMessage) => void
export type ClientMessageHandler = (message: WorkerOutboundMessage) => void

export type RespondFn = (message: WorkerOutboundMessage) => void
export type WorkerMessageHandler = (message: WorkerInboundMessage, respond: RespondFn) => void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WorkerCustomMethods = Record<string, (...args: any[]) => Promise<any>>

export type SerializedResult<T> = { __serialized__: T }

export function serializeResult<T>(result: T): SerializedResult<T> {
    if (Array.isArray(result)) {
        return result.map(serializeResult) as unknown as SerializedResult<T>
    }

    if (result instanceof Map) {
        for (const [key, value] of result.entries()) {
            result.set(key, serializeResult(value))
        }

        return result as unknown as SerializedResult<T>
    }

    if (result && typeof result === 'object') {
        // replace Long instances with a special object
        for (const [key, value] of Object.entries(result)) {
            if (Long.isLong(value)) {
                // eslint-disable-next-line
                ;(result as any)[key] = {
                    __type: 'long',
                    low: value.low,
                    high: value.high,
                    unsigned: value.unsigned,
                }
            } else {
                // eslint-disable-next-line
                ;(result as any)[key] = serializeResult(value)
            }
        }
    }

    return result as unknown as SerializedResult<T>
}

export function deserializeResult<T>(result: SerializedResult<T>): T {
    if (Array.isArray(result)) {
        return result.map(deserializeResult) as unknown as T
    }

    if (result instanceof Map) {
        for (const [key, value] of result.entries()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result.set(key, deserializeResult(value))
        }

        return result as unknown as T
    }

    if (result && typeof result === 'object') {
        for (const [key, value] of Object.entries(result)) {
            if (value && typeof value === 'object' && (value as Record<string, string>).__type === 'long') {
                // eslint-disable-next-line
                ;(result as any)[key] = Long.fromValue(value as unknown as Long)
            } else {
                // eslint-disable-next-line
                ;(result as any)[key] = deserializeResult(value as SerializedResult<unknown>)
            }
        }
    }

    return result as unknown as T
}
