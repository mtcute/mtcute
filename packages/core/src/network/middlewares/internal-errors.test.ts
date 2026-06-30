import type { RpcCallMiddlewareContext } from '../network-manager.js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MtTimeoutError } from '../../types/errors.js'
import { internalErrorsHandler } from './internal-errors.js'

const okResult = { _: 'messages.affectedMessages' }
const req = { _: 'messages.sendMessage' }

const internalErr = (code = -503, message = 'Timeout') => ({ _: 'mt_rpc_error', errorCode: code, errorMessage: message })

function makeManager() {
  return {
    params: { isPremium: false, stopSignal: new AbortController().signal },
    getPrimaryDcId: () => 2,
    _log: { warn: () => {} },
  } as unknown as RpcCallMiddlewareContext['manager']
}

function makeCtx(params?: object): RpcCallMiddlewareContext {
  return { request: req, params, manager: makeManager() } as unknown as RpcCallMiddlewareContext
}

describe('internalErrorsHandler', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('passes a successful result through', async () => {
    const mw = internalErrorsHandler({})
    const next = vi.fn(async () => okResult)
    expect(await mw(makeCtx(), next)).toBe(okResult)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('retries an internal error after waiting, then succeeds', async () => {
    vi.useFakeTimers()
    const mw = internalErrorsHandler({})
    let calls = 0
    const next = async () => {
      calls++
      return calls === 1 ? internalErr() : okResult
    }

    const p = mw(makeCtx(), next)
    await vi.advanceTimersByTimeAsync(1000)
    expect(await p).toBe(okResult)
    expect(calls).toBe(2)
  })

  it('returns client errors immediately without retrying', async () => {
    const mw = internalErrorsHandler({})
    let calls = 0
    const next = async () => {
      calls++
      return { _: 'mt_rpc_error', errorCode: 400, errorMessage: 'BAD_REQUEST' }
    }

    const res = await mw(makeCtx(), next)
    expect((res as { errorCode: number }).errorCode).toBe(400)
    expect(calls).toBe(1)
  })

  it('throws MtTimeoutError on -503 when throw503 is set', async () => {
    const mw = internalErrorsHandler({})
    const next = async () => internalErr(-503, 'Timeout')
    await expect(mw(makeCtx({ throw503: true }), next)).rejects.toBeInstanceOf(MtTimeoutError)
  })

  it('returns errors listed in exceptErrors immediately', async () => {
    const mw = internalErrorsHandler({ exceptErrors: ['SOME_INTERNAL_ERROR'] })
    let calls = 0
    const next = async () => {
      calls++
      return internalErr(-500, 'SOME_INTERNAL_ERROR')
    }

    const res = await mw(makeCtx(), next)
    expect((res as { errorMessage: string }).errorMessage).toBe('SOME_INTERNAL_ERROR')
    expect(calls).toBe(1)
  })

  it('gives up after maxRetries', async () => {
    vi.useFakeTimers()
    const mw = internalErrorsHandler({ maxRetries: 1 })
    let calls = 0
    const next = async () => {
      calls++
      return internalErr()
    }

    const p = mw(makeCtx(), next)
    await vi.advanceTimersByTimeAsync(5000)
    await p
    expect(calls).toBe(2)
  })
})
