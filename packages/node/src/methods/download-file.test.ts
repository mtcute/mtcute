import { Writable } from 'node:stream'
import { sleep } from '@fuman/utils'
import { describe, expect, it, vi } from 'vitest'

let stream: Writable
let written: number
let chunks: Uint8Array[] = []
let failAfterChunks = true

if (process.env.TEST_ENV !== 'browser') {
  vi.mock('node:fs', () => ({
    createWriteStream: () => stream,
    rmSync: vi.fn(),
  }))
  vi.mock('node:fs/promises', () => ({ writeFile: vi.fn() }))
  vi.mock('@mtcute/core/methods.js', () => ({
    async* downloadAsIterable() {
      for (const chunk of chunks) yield chunk
      if (failAfterChunks) throw new Error('boom')
    },
  }))

  const { downloadToFile } = await import('./download-file.js')

  const client = { log: { debug: vi.fn() } } as any

  const setup = (onWrite?: (cb: (err?: Error) => void) => void) => {
    written = 0
    chunks = [new Uint8Array([1, 2, 3])]
    failAfterChunks = true
    stream = new Writable({
      highWaterMark: 1024,
      write(chunk, _enc, cb) {
        written += chunk.length
        if (onWrite) onWrite(cb)
        else cb()
      },
    })
  }

  describe('downloadToFile', () => {
    it('should destroy the write stream when the download fails', async () => {
      setup()

      await expect(downloadToFile(client, 'out.bin', {} as any)).rejects.toThrow('boom')

      expect(stream.destroyed).toBe(true)
    })

    it('should not resolve until the stream has finished', async () => {
      setup(cb => setTimeout(cb, 5))
      failAfterChunks = false
      chunks = Array.from({ length: 64 }, () => new Uint8Array(1024))

      let resolved = false
      const promise = downloadToFile(client, 'out.bin', {} as any).then(() => {
        resolved = true
      })

      await sleep(30)
      expect(resolved).toBe(false)
      expect(written).toBeLessThan(64 * 1024)

      await promise
      expect(written).toBe(64 * 1024)
      expect(stream.writableFinished).toBe(true)
    })

    it('should reject rather than hang when the stream errors', async () => {
      setup(cb => cb(new Error('ENOSPC')))
      failAfterChunks = false
      chunks = Array.from({ length: 64 }, () => new Uint8Array(1024))

      await expect(downloadToFile(client, 'out.bin', {} as any)).rejects.toThrow('ENOSPC')
    }, 5000)
  })
} else {
  describe.skip('downloadToFile', () => {})
}
