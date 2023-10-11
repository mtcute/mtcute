import { ParsedUpdate, TelegramClient } from '@mtcute/client'

export type UpdateContext<T> = T & {
    client: TelegramClient
    _name: Extract<ParsedUpdate, { data: T }>['name']
}

export type UpdateContextDistributed<T> = T extends never ? never : UpdateContext<T>
