import type { ParsedUpdate } from '@mtcute/core'
import type { TelegramClient } from '@mtcute/core/client.js'

export type UpdateContext<T> = T & {
  client: TelegramClient
  _name: Extract<ParsedUpdate, { data: T }>['name']
}

export type UpdateContextDistributed<T> = T extends never ? never : UpdateContext<T>
