import { describe, expect, it } from 'vitest'

import { streamToBuffer } from './stream-utils.js'

describe('streamToBuffer', () => {
  it('should release the reader lock on success', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]))
        controller.close()
      },
    })

    await streamToBuffer(stream)

    expect(stream.locked).toBe(false)
  })

  it('should release the reader lock on error', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('boom'))
      },
    })

    await expect(streamToBuffer(stream)).rejects.toThrow('boom')

    expect(stream.locked).toBe(false)
  })
})
