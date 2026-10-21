import type { IReadable } from '@fuman/io'

import { Bytes } from '@fuman/io'
import { u8 } from '@fuman/utils'
import { defaultCryptoProvider, StubTelegramClient } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

import { uploadFile } from './upload-file.js'

describe('uploadFile', () => {
  const partSize = 1024

  it.each([
    { name: 'exact parts', size: partSize * 64, parts: 64, knownSize: true },
    { name: 'trailing partial part', size: partSize * 64 + 100, parts: 65, knownSize: true },
    { name: 'unknown size', size: partSize * 64 + 100, parts: 65, knownSize: false },
  ])('should upload each part under its own index when reads and requests resolve out of order ($name)', async ({
    size,
    parts: partCount,
    knownSize,
  }) => {
    const client = new StubTelegramClient()
    await client.storage.self.store({
      userId: 1,
      isBot: false,
      isPremium: false,
      usernames: [],
    })

    const data = defaultCryptoProvider.randomBytes(size)

    let seed = 42
    const waitHops = async () => {
      seed ^= seed << 13
      seed ^= seed >>> 17
      seed ^= seed << 5
      for (let i = (seed >>> 0) % 10; i > 0; i--) await Promise.resolve()
    }

    const parts: Uint8Array[] = []
    const onPart = async (filePart: number, bytes: Uint8Array) => {
      await waitHops()
      parts[filePart] = bytes
      return true
    }
    client.respondWith('upload.saveFilePart', req => onPart(req.filePart, req.bytes))
    client.respondWith('upload.saveBigFilePart', req => onPart(req.filePart, req.bytes))

    const source = Bytes.from(data)
    const file: IReadable = {
      async read(into) {
        await waitHops()
        return source.read(into)
      },
    }

    await client.with(async () => {
      const uploaded = await uploadFile(client, {
        file,
        fileSize: knownSize ? size : undefined,
        partSize: partSize / 1024,
      })

      expect(uploaded.inputFile).toMatchObject({ parts: partCount })
      expect(u8.concat(parts)).toEqual(data)
    })
  })
})
