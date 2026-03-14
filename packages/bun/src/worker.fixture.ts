import { createTestWorkerClient } from '@mtcute/test'

import { TelegramWorker } from './worker.js'

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

new TelegramWorker({
  client: createTestWorkerClient(),
  customMethods: {
    async echo(value: string, delay = 0): Promise<string> {
      if (delay) {
        await sleep(delay)
      }

      return `${value}:done`
    },
  },
}).mount()
