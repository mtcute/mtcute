import type { ParsedUpdate } from '@mtcute/core'
import type { TelegramClient } from '@mtcute/core/client.js'

// broken in typedoc, i can't be bothered to fix
/** @hidden */
export type UpdateContext<T> = T & {
  client: TelegramClient
  _name: Extract<ParsedUpdate, { data: T }>['name']
}

export type UpdateContextDistributed<T> = T extends never ? never : UpdateContext<T>
