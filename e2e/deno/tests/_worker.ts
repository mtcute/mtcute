import type { WorkerCustomMethods } from '@mtcute/core/worker.js'
import { BaseTelegramClient, TelegramWorker } from '@mtcute/deno'

import { getApiParams } from '../utils.ts'

const customMethods = {
    hello: async () => 'world',
    sum: async (a: number, b: number) => a + b,
} as const satisfies WorkerCustomMethods
export type CustomMethods = typeof customMethods

const client = new BaseTelegramClient(getApiParams('dc1.session'))

// eslint-disable-next-line no-new
new TelegramWorker({
    client,
    customMethods,
})
