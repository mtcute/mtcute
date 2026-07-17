import { describe, expect, it } from 'vitest'

import { reqToPromise, txToPromise } from './utils.js'

describe('txToPromise', () => {
  it('should reject with a fallback error when tx.error is null', async () => {
    const tx = { error: null } as unknown as IDBTransaction

    const promise = txToPromise(tx)
    ;(tx as unknown as { onerror: () => void }).onerror()

    await expect(promise).rejects.toThrow('IDB transaction was aborted')
  })

  it('should reject with tx.error when present', async () => {
    const error = new Error('quota exceeded')
    const tx = { error } as unknown as IDBTransaction

    const promise = txToPromise(tx)
    ;(tx as unknown as { onerror: () => void }).onerror()

    await expect(promise).rejects.toBe(error)
  })
})

describe('reqToPromise', () => {
  it('should reject with a fallback error when req.error is null', async () => {
    const req = { error: null } as unknown as IDBRequest<void>

    const promise = reqToPromise(req)
    ;(req as unknown as { onerror: () => void }).onerror()

    await expect(promise).rejects.toThrow('IDB request failed')
  })

  it('should reject with req.error when present', async () => {
    const error = new Error('data error')
    const req = { error } as unknown as IDBRequest<void>

    const promise = reqToPromise(req)
    ;(req as unknown as { onerror: () => void }).onerror()

    await expect(promise).rejects.toBe(error)
  })
})
