import type { tl } from '../../../tl/index.js'
import { sleep } from '@fuman/utils'
import { StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { describe, expect, it } from 'vitest'

import { downloadAsStream } from './download-stream.js'

describe('downloadAsStream', () => {
  const stubLocation: tl.RawInputDocumentFileLocation = {
    _: 'inputDocumentFileLocation',
    id: Long.fromNumber(123456),
    accessHash: Long.fromNumber(789012),
    fileReference: new Uint8Array([1, 2, 3, 4]),
    thumbSize: '',
  }

  const createClient = () => {
    const client = new StubTelegramClient()
    const stats = { requests: 0 }

    client.respondWith('upload.getFile', (req) => {
      stats.requests++

      return {
        _: 'upload.file',
        type: { _: 'storage.fileMp4' },
        mtime: 0,
        bytes: new Uint8Array(req.limit),
      }
    })

    return { client, stats }
  }

  it('should stop downloading while the stream is not being read', async () => {
    const { client, stats } = createClient()

    await client.with(async () => {
      const stream = downloadAsStream(client, stubLocation)
      await sleep(300)

      const before = stats.requests
      await sleep(500)

      expect(stats.requests).toBe(before)

      await stream.cancel()
    })
  })
})
