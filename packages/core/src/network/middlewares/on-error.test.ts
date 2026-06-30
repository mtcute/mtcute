import type { RpcCallMiddlewareContext } from '../network-manager.js'
import { describe, expect, it, vi } from 'vitest'

import { onRpcError } from './on-error.js'

const okResult = { _: 'messages.affectedMessages' }
const rpcErr = () => ({ _: 'mt_rpc_error', errorCode: 400, errorMessage: 'BAD_REQUEST' })

const ctx = { request: { _: 'messages.sendMessage' } } as unknown as RpcCallMiddlewareContext

describe('onRpcError', () => {
  it('does not call the handler on success', async () => {
    const handler = vi.fn()
    const mw = onRpcError(handler)
    expect(await mw(ctx, async () => okResult)).toBe(okResult)
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls the handler on an rpc error and replaces the result', async () => {
    const mw = onRpcError(async () => 'replaced')
    expect(await mw(ctx, async () => rpcErr())).toBe('replaced')
  })

  it('keeps the original error when the handler returns undefined', async () => {
    const err = rpcErr()
    const handler = vi.fn(async () => undefined)
    const mw = onRpcError(handler)
    expect(await mw(ctx, async () => err)).toBe(err)
    expect(handler).toHaveBeenCalledWith(ctx, err)
  })
})
