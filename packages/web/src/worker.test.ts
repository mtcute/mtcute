import { afterEach, describe, expect, it } from 'vitest'

import { TelegramWorkerPort } from './worker.js'

// eslint-disable-next-line ts/consistent-type-definitions
type TestCustomMethods = {
  echo: (value: string, delay?: number) => Promise<string>
}

function createSharedWorker(name = `mtcute-web-worker-${Math.random().toString(36).slice(2)}`): SharedWorker {
  return new SharedWorker(new URL('./worker.shared.fixture.ts', import.meta.url), {
    type: 'module',
    name,
  })
}

if (process.env.TEST_ENV === 'browser' && typeof SharedWorker !== 'undefined') {
  describe('web worker adapter', () => {
    const ports: TelegramWorkerPort<TestCustomMethods>[] = []

    afterEach(async () => {
      while (ports.length) {
        await ports.pop()!.destroy()
      }
    })

    it('should route colliding invoke ids across multiple shared worker owners', async () => {
      const name = `mtcute-web-worker-${Math.random().toString(36).slice(2)}`
      const worker1 = createSharedWorker(name)
      const worker2 = createSharedWorker(name)
      const port1 = new TelegramWorkerPort<TestCustomMethods>({ worker: worker1 })
      const port2 = new TelegramWorkerPort<TestCustomMethods>({ worker: worker2 })

      ports.push(port1, port2)

      const p1 = port1.invokeCustom('echo', 'first', 30)
      const p2 = port2.invokeCustom('echo', 'second', 0)

      await expect(p1).resolves.toBe('first:done')
      await expect(p2).resolves.toBe('second:done')
    })

    it('should ignore malformed shared worker messages before adapter bookkeeping', async () => {
      const worker = createSharedWorker()
      const port = new TelegramWorkerPort<TestCustomMethods>({ worker })

      ports.push(port)

      worker.port.postMessage({
        type: 'release',
        connectionId: port.connectionId,
      })

      await expect(port.invokeCustom('echo', 'still-alive')).resolves.toBe('still-alive:done')
    })
  })
} else {
  describe.skip('web worker adapter', () => {})
}
