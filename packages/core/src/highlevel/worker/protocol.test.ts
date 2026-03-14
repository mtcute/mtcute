import Long from 'long'
import { describe, expect, it } from 'vitest'
import { deserializeResult, serializeResult } from './protocol.js'

describe('worker/protocol', () => {
  it('should serialize and deserialize nested Long values', () => {
    const input = {
      id: Long.fromString('1234567890123456789'),
      nested: {
        values: [Long.fromInt(5), { other: Long.fromInt(7) }],
      },
    }

    const serialized = serializeResult(input)

    expect(Long.isLong((serialized as any).id)).toBe(false)

    const restored = deserializeResult(serialized)

    expect(Long.isLong(restored.id)).toBe(true)
    expect(restored.id.toString()).toBe('1234567890123456789')
    expect(Long.isLong(restored.nested.values[0])).toBe(true)
    expect((restored.nested.values[1] as any).other.toString()).toBe('7')
  })

  it('should preserve typed arrays and map contents', () => {
    const payload = {
      bytes: new Uint8Array([1, 2, 3]),
      entries: new Map<number, { count: Long }>([
        [1, { count: Long.fromInt(42) }],
      ]),
    }

    const serialized = serializeResult(payload)
    const restored = deserializeResult(serialized)

    expect((serialized as any).bytes).toBe(payload.bytes)
    expect(restored.bytes).toBe(payload.bytes)
    expect(restored.entries.get(1)?.count.toString()).toBe('42')
  })
})
