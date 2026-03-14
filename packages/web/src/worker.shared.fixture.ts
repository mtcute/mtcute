/// <reference lib="webworker" />

import { createTestWorkerClient } from '@mtcute/test'

import { TelegramWorker } from './worker.js'

function sleep(ms: number): Promise<void> {
  // eslint-disable-next-line no-restricted-globals
  return new Promise(resolve => setTimeout(resolve, ms))
}

new TelegramWorker({
  // eslint-disable-next-line ts/no-unsafe-assignment
  client: createTestWorkerClient(),
  customMethods: {
    async echo(value: string, delay = 0): Promise<string> {
      if (delay) {
        // eslint-disable-next-line ts/no-unsafe-argument
        await sleep(delay)
      }

      return `${value}:done`
    },
  },
}).mount()
