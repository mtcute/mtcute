import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MemoryStateStorage } from './providers/index.js'
import { StateService } from './service.js'

describe('StateService', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('should only create one vacuum timer under concurrent load', async () => {
    const svc = new StateService(new MemoryStateStorage())

    await Promise.all([svc.load(), svc.load(), svc.load()])

    expect(vi.getTimerCount()).toBe(1)

    await svc.destroy()

    expect(vi.getTimerCount()).toBe(0)
  })
})
