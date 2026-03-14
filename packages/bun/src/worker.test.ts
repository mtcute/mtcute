import type { WorkerCustomMethods } from '@mtcute/core/worker.js'

import { Worker } from 'node:worker_threads'

import { afterEach, describe, expect, it } from 'vitest'

import { TelegramWorkerPort } from './worker.js'

type TestCustomMethods = WorkerCustomMethods & {
  echo: (value: string, delay?: number) => Promise<string>
}

function createWorker(): Worker {
  return new Worker(new URL('./worker.fixture.ts', import.meta.url))
}

if (process.env.TEST_ENV === 'bun') {
  describe('bun worker adapter', () => {
    const workers: Worker[] = []
    const ports: TelegramWorkerPort<TestCustomMethods>[] = []

    afterEach(async () => {
      while (ports.length) {
        await ports.pop()!.destroy()
      }

      while (workers.length) {
        await workers.pop()!.terminate()
      }
    })

    it('should invoke custom methods through a real worker thread', async () => {
      const worker = createWorker()
      const port = new TelegramWorkerPort<TestCustomMethods>({ worker })

      workers.push(worker)
      ports.push(port)

      await expect(port.invokeCustom('echo', 'single')).resolves.toBe('single:done')
    })

    it('should route colliding invoke ids across multiple ports on one worker', async () => {
      const worker = createWorker()
      const port1 = new TelegramWorkerPort<TestCustomMethods>({ worker })
      const port2 = new TelegramWorkerPort<TestCustomMethods>({ worker })

      workers.push(worker)
      ports.push(port1, port2)

      const p1 = port1.invokeCustom('echo', 'first', 30)
      const p2 = port2.invokeCustom('echo', 'second', 0)

      await expect(p1).resolves.toBe('first:done')
      await expect(p2).resolves.toBe('second:done')
    })
  })
} else {
  describe.skip('bun worker adapter', () => {})
}
