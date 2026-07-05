import type { tl } from '../../../tl/index.js'
import { defaultCryptoProvider, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { describe, expect, it } from 'vitest'

import { downloadAsIterable } from './download-iterable.js'

describe('downloadAsIterable', () => {
  const data = defaultCryptoProvider.randomBytes(16 * 1024)

  const createClient = () => {
    const client = new StubTelegramClient()

    client.respondWith('upload.getFile', (req) => {
      const offset = Number(req.offset)
      const end = Math.min(offset + req.limit, data.byteLength)

      return {
        _: 'upload.file',
        type: { _: 'storage.fileMp4' },
        mtime: 0,
        bytes: data.subarray(offset, end),
      }
    })

    return client
  }

  const stubLocation: tl.RawInputDocumentFileLocation = {
    _: 'inputDocumentFileLocation',
    id: Long.fromNumber(123456),
    accessHash: Long.fromNumber(789012),
    fileReference: new Uint8Array([1, 2, 3, 4]),
    thumbSize: '',
  }

  it('should remove the abort listener after completion', async () => {
    const client = createClient()
    const controller = new AbortController()

    let balance = 0
    const origAdd = controller.signal.addEventListener.bind(controller.signal)
    const origRemove = controller.signal.removeEventListener.bind(controller.signal)
    controller.signal.addEventListener = ((...args: Parameters<typeof origAdd>) => {
      balance++
      return origAdd(...args)
    }) as typeof origAdd
    controller.signal.removeEventListener = ((...args: Parameters<typeof origRemove>) => {
      balance--
      return origRemove(...args)
    }) as typeof origRemove

    await client.with(async () => {
      for await (const _ of downloadAsIterable(client, stubLocation, {
        abortSignal: controller.signal,
        fileSize: data.byteLength,
      })) {
        // drain
      }
    })

    expect(balance).toBe(0)
  })
})
