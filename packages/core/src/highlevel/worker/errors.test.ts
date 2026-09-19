import { describe, expect, it } from 'vitest'

import { MtArgumentError, MtcuteError, MtTypeAssertionError } from '../../types/errors.js'
import { MtPeerNotFoundError } from '../types/errors.js'

import { deserializeError, serializeError } from './errors.js'

function roundtripError(err: Error): Error {
  return deserializeError(serializeError(err))
}

describe('worker errors', () => {
  it('should preserve MtcuteError subclasses without dedicated handling', () => {
    class MtCustomError extends MtcuteError {}

    const res = roundtripError(new MtCustomError('custom'))

    expect(res).toBeInstanceOf(MtcuteError)
    expect(res.message).toBe('custom')
  })

  it('should preserve messages of message-only errors', () => {
    const res1 = roundtripError(new MtArgumentError('bad arg'))
    expect(res1).toBeInstanceOf(MtArgumentError)
    expect(res1.message).toBe('bad arg')

    const res2 = roundtripError(new MtPeerNotFoundError('no peer'))
    expect(res2).toBeInstanceOf(MtPeerNotFoundError)
    expect(res2.message).toBe('no peer')

    const res3 = roundtripError(new MtcuteError('generic'))
    expect(res3).toBeInstanceOf(MtcuteError)
    expect(res3.message).toBe('generic')
  })

  it('should preserve MtTypeAssertionError fields', () => {
    const res = roundtripError(new MtTypeAssertionError('user', 'userEmpty'))

    expect(res).toBeInstanceOf(MtTypeAssertionError)
    expect(res).toMatchObject({ expected: 'user', actual: 'userEmpty' })
    expect(res.message).toBe('Type assertion failed: expected user, got userEmpty')
  })
})
