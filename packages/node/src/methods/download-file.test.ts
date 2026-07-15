import { describe, expect, it, vi } from 'vitest'

const destroy = vi.fn()
const end = vi.fn()
if (process.env.TEST_ENV !== 'browser') {
  vi.mock('node:fs', () => ({
    createWriteStream: () => ({ write: vi.fn(), end, destroy }),
    rmSync: vi.fn(),
  }))
  vi.mock('node:fs/promises', () => ({ writeFile: vi.fn() }))
  vi.mock('@mtcute/core/methods.js', () => ({
    async* downloadAsIterable() {
      yield new Uint8Array([1, 2, 3])
      throw new Error('boom')
    },
  }))

  const { downloadToFile } = await import('./download-file.js')

  describe('downloadToFile', () => {
    it('should destroy the write stream when the download fails', async () => {
      const client = { log: { debug: vi.fn() } } as any

      await expect(downloadToFile(client, 'out.bin', {} as any)).rejects.toThrow('boom')

      expect(destroy).toHaveBeenCalled()
      expect(end).not.toHaveBeenCalled()
    })
  })
} else {
  describe.skip('downloadToFile', () => {})
}
