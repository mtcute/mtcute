import type { RpcCallMiddlewareContext } from '../network-manager.js'
import { describe, expect, it, vi } from 'vitest'

import { onMethod } from './on-method.js'

const okResult = { _: 'messages.affectedMessages' }

function makeCtx(method: string): RpcCallMiddlewareContext {
  return { request: { _: method } } as unknown as RpcCallMiddlewareContext
}

describe('onMethod', () => {
  it('intercepts the matching method and skips next', async () => {
    const next = vi.fn(async () => okResult)
    const mw = onMethod('help.getNearestDc', (async () => 'intercepted') as never)
    expect(await mw(makeCtx('help.getNearestDc'), next)).toBe('intercepted')
    expect(next).not.toHaveBeenCalled()
  })

  it('passes other methods through to next', async () => {
    const handler = vi.fn()
    const mw = onMethod('help.getNearestDc', handler as never)
    expect(await mw(makeCtx('messages.sendMessage'), async () => okResult)).toBe(okResult)
    expect(handler).not.toHaveBeenCalled()
  })
})
