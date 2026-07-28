import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileLocation } from '@mtcute/core'
import { describe, expect, it, vi } from 'vitest'

let iterableCalls = 0
let chunks: Uint8Array[] = []
let failAfterChunks = false

vi.mock('@mtcute/core/methods.js', () => ({
  async* downloadAsIterable() {
    iterableCalls++
    for (const chunk of chunks) yield chunk
    if (failAfterChunks) throw new Error('boom')
  },
}))

const { downloadToFile } = await import('./download-file.js')

describe('downloadToFile (deno)', () => {
  const client = { log: { debug: vi.fn() } } as any
  const tmp = () => join(tmpdir(), `mtcute-deno-${Math.random().toString(36).slice(2)}`)

  const reset = () => {
    iterableCalls = 0
    chunks = [new Uint8Array([1, 2, 3])]
    failAfterChunks = false
  }

  it('should not download anything for an inline file', async () => {
    reset()
    const file = tmp()

    const bytes = new Uint8Array([1, 2, 3, 4, 5])
    await downloadToFile(client, file, new FileLocation(bytes))

    // the bytes are already in hand — there is nothing to download, and the file
    // must not be reopened (with truncate!) and written a second time
    expect(iterableCalls).toBe(0)
    expect(Deno.statSync(file).size).toBe(bytes.length)

    Deno.removeSync(file)
  })

  it('should close the file when the download fails', async () => {
    reset()
    failAfterChunks = true
    const file = tmp()

    let closed = false
    const realOpen = Deno.open.bind(Deno)
    const spy = vi.spyOn(Deno, 'open').mockImplementation(async (...args: Parameters<typeof Deno.open>) => {
      const fd = await realOpen(...args)
      const realClose = fd.close.bind(fd)
      fd.close = () => {
        closed = true
        realClose()
      }
      return fd
    })

    try {
      await expect(downloadToFile(client, file, {} as any)).rejects.toThrow('boom')
      expect(closed).toBe(true)
    } finally {
      spy.mockRestore()
      try {
        Deno.removeSync(file)
      } catch {}
    }
  })
})
