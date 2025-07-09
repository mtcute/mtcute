import type { tl } from '@mtcute/tl'

import type { Worker as NodeWorker } from 'node:worker_threads'
import type { ConnectionState } from '../client.types.js'

import type { SerializedError } from './errors.js'

import Long from 'long'

export type WorkerInboundMessage =
  | {
      _mtcuteWorkerId: string
      type: 'invoke'
      id: number
      target: 'custom' | 'client' | 'storage' | 'storage-self' | 'storage-peers' | 'app-config'
      method: string
      args: SerializedResult<unknown[]>
      void: boolean
      withAbort: boolean
  }
  | {
      _mtcuteWorkerId: string
      type: 'abort'
      id: number
  }

export type WorkerOutboundMessage =
  | {
      _mtcuteWorkerId: string
      type: 'server_update'
      update: SerializedResult<tl.TypeUpdates>
  }
  | {
      _mtcuteWorkerId: string
      type: 'update'
      update: SerializedResult<tl.TypeUpdate>
      users: SerializedResult<Map<number, tl.TypeUser>>
      chats: SerializedResult<Map<number, tl.TypeChat>>
      hasMin: boolean
  }
  | {
      _mtcuteWorkerId: string
      type: 'error'
      error: SerializedError
  }
  | {
      _mtcuteWorkerId: string
      type: 'stop'
  }
  | {
      _mtcuteWorkerId: string
      type: 'conn_state'
      state: ConnectionState
  }
  | {
      _mtcuteWorkerId: string
      type: 'log'
      color: number
      level: number
      tag: string
      fmt: string
      args: unknown[]
  }
  | {
      _mtcuteWorkerId: string
      type: 'result'
      id: number
      result?: SerializedResult<unknown>
      error?: SerializedError
  }

export const DEFAULT_WORKER_ID = 'default'

// <deno-insert>
// declare type SharedWorker = never
// </deno-insert>

export type SomeWorker = NodeWorker | Worker | SharedWorker

export type SendFn = (message: WorkerInboundMessage) => void
export type ClientMessageHandler = (message: WorkerOutboundMessage) => void

export type RespondFn = (message: WorkerOutboundMessage) => void
export type WorkerMessageHandler = (message: WorkerInboundMessage, respond: RespondFn) => void

export type WorkerCustomMethods = Record<string, (...args: any[]) => Promise<any>>

export interface SerializedResult<T> { __serialized__: T }

export function serializeResult<T>(result: T): SerializedResult<T> {
    if (ArrayBuffer.isView(result)) return result as unknown as SerializedResult<T>

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
        const newResult: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(result)) {
            if (Long.isLong(value)) {
                newResult[key] = {
                    __type: 'long',
                    low: value.low,
                    high: value.high,
                    unsigned: value.unsigned,
                }
            } else if (typeof value === 'object') {
                newResult[key] = serializeResult(value)
            } else {
                newResult[key] = value
            }
        }

        return newResult as unknown as SerializedResult<T>
    }

    return result as unknown as SerializedResult<T>
}

export function deserializeResult<T>(result: SerializedResult<T>): T {
    if (ArrayBuffer.isView(result)) return result as unknown as T

    if (Array.isArray(result)) {
        return result.map(deserializeResult) as unknown as T
    }

    if (result instanceof Map) {
        for (const [key, value] of result.entries()) {
            // eslint-disable-next-line ts/no-unsafe-argument
            result.set(key, deserializeResult(value))
        }

        return result as unknown as T
    }

    if (result && typeof result === 'object') {
        for (const [key, value] of Object.entries(result)) {
            if (value && typeof value === 'object' && (value as Record<string, string>).__type === 'long') {
                ;(result as any)[key] = Long.fromValue(value as unknown as Long)
            } else if (typeof value === 'object') {
                ;(result as any)[key] = deserializeResult(value as SerializedResult<unknown>)
            }
        }
    }

    return result as unknown as T
}
