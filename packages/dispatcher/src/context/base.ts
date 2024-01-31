import { ParsedUpdate, TelegramClient } from '@mtcute/core'

export type UpdateContext<T> = T & {
    client: TelegramClient
    _name: Extract<ParsedUpdate, { data: T }>['name']
}

export type UpdateContextDistributed<T> = T extends never ? never : UpdateContext<T>
