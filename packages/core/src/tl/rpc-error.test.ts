import { describe, expect, it } from 'vitest'

import { tl } from './index.js'

describe('RpcError.is', () => {
  it('should not throw on nullish values', () => {
    expect(tl.RpcError.is(null)).toBe(false)
    expect(tl.RpcError.is(undefined)).toBe(false)
    expect(tl.RpcError.is(null, 'FLOOD_WAIT_%d')).toBe(false)
    expect(tl.RpcError.is(undefined, 'FLOOD_WAIT_%d')).toBe(false)
  })

  it('should match RpcError instances', () => {
    const err = new tl.RpcError(420, 'FLOOD_WAIT_%d')

    expect(tl.RpcError.is(err)).toBe(true)
    expect(tl.RpcError.is(err, 'FLOOD_WAIT_%d')).toBe(true)
    expect(tl.RpcError.is(err, 'USER_NOT_FOUND')).toBe(false)
    expect(tl.RpcError.is(new Error('lol'))).toBe(false)
  })
})
