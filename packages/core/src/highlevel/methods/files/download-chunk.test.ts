import type { tl } from '@mtcute/tl'
import { assert } from '@fuman/utils'

import { createStub, defaultCryptoProvider, StubTelegramClient } from '@mtcute/test'
import Long from 'long'
import { describe, expect, it } from 'vitest'
import { MtArgumentError, MtUnsupportedError } from '../../../types/errors.js'
import { FileLocation } from '../../types/index.js'
import { downloadChunk } from './download-chunk.js'

/* eslint-disable ts/no-unsafe-assignment, ts/no-unsafe-return, ts/no-unsafe-argument */

describe('downloadChunk', () => {
  const defaultData = defaultCryptoProvider.randomBytes(32 * 1024)

  const createClient = (data: Uint8Array = defaultData) => {
    const client = new StubTelegramClient()

    // Mock upload.getFile to return chunks of the pre-generated data
    client.respondWith('upload.getFile', (req) => {
      const { offset, limit, precise } = req

      assert(precise === true)
      assert(offset % 1024 === 0)
      assert(limit % 1024 === 0)
      assert(limit <= 1048576)

      const end = Math.min(Number(offset) + limit, data.byteLength)
      const bytes = data.subarray(Number(offset), end)

      return {
        _: 'upload.file',
        type: { _: 'storage.fileMp4' },
        mtime: 0,
        bytes,
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

  describe('basic functionality', () => {
    it('should download an aligned chunk', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 1024,
          limit: 2048,
        })

        expect(result.byteLength).toBe(2048)
        expect(result).toEqual(defaultData.subarray(1024, 1024 + 2048))
      })
    })

    it('should download from the start of the file', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 0,
          limit: 1024,
        })

        expect(result.byteLength).toBe(1024)
        expect(result).toEqual(defaultData.subarray(0, 1024))
      })
    })
  })

  describe('unaligned offsets', () => {
    it('should handle unaligned offset (round down)', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 1500, // Not aligned to 1024
          limit: 1024,
        })

        expect(result.byteLength).toBe(1024)
        expect(result).toEqual(defaultData.subarray(1500, 1500 + 1024))
      })
    })

    it('should handle small unaligned offset', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 100,
          limit: 512,
        })

        expect(result.byteLength).toBe(512)
        expect(result).toEqual(defaultData.subarray(100, 100 + 512))
      })
    })

    it('should handle offset just before alignment boundary', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 2047, // 1 byte before 2048
          limit: 1024,
        })

        expect(result.byteLength).toBe(1024)
        expect(result).toEqual(defaultData.subarray(2047, 2047 + 1024))
      })
    })
  })

  describe('unaligned limits', () => {
    it('should handle unaligned limit (round up)', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 0,
          limit: 1500, // Not aligned to 1024
        })

        expect(result.byteLength).toBe(1500)
        expect(result).toEqual(defaultData.subarray(0, 1500))
      })
    })

    it('should handle small unaligned limit', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 1024,
          limit: 100,
        })

        expect(result.byteLength).toBe(100)
        expect(result).toEqual(defaultData.subarray(1024, 1024 + 100))
      })
    })

    it('should handle limit just before alignment boundary', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 0,
          limit: 2047, // 1 byte before 2048
        })

        expect(result.byteLength).toBe(2047)
        expect(result).toEqual(defaultData.subarray(0, 2047))
      })
    })
  })

  describe('both offset and limit unaligned', () => {
    it('should handle both offset and limit unaligned', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 1500,
          limit: 1500,
        })

        expect(result.byteLength).toBe(1500)
        expect(result).toEqual(defaultData.subarray(1500, 1500 + 1500))
      })
    })

    it('should handle small unaligned offset and limit', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 100,
          limit: 200,
        })

        expect(result.byteLength).toBe(200)
        expect(result).toEqual(defaultData.subarray(100, 100 + 200))
      })
    })

    it('should handle complex unaligned case', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 1023,
          limit: 1025,
        })

        expect(result.byteLength).toBe(1025)
        expect(result).toEqual(defaultData.subarray(1023, 1023 + 1025))
      })
    })

    it('should handle offset and limit near boundaries', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 2047,
          limit: 2049,
        })

        expect(result.byteLength).toBe(2049)
        expect(result).toEqual(defaultData.subarray(2047, 2047 + 2049))
      })
    })
  })

  describe('edge cases', () => {
    it('should handle downloading near the end of file', async () => {
      const client = createClient()

      await client.with(async () => {
        const offset = defaultData.byteLength - 1024
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset,
          limit: 1024,
        })

        expect(result.byteLength).toBe(1024)
        expect(result).toEqual(defaultData.subarray(offset, offset + 1024))
      })
    })

    it('should handle downloading at file boundary with unaligned offset', async () => {
      const client = createClient()

      await client.with(async () => {
        const offset = defaultData.byteLength - 512
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset,
          limit: 512,
        })

        expect(result.byteLength).toBe(512)
        expect(result).toEqual(defaultData.subarray(offset, offset + 512))
      })
    })

    it('should handle exact 1MB limit (aligned)', async () => {
      const client = createClient(new Uint8Array(1048576))

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 0,
          limit: 1048576,
        })

        expect(result.byteLength).toBe(1048576)
      })
    })
  })

  describe('error cases', () => {
    it('should throw error when limit exceeds 1MB after alignment', async () => {
      const client = createClient()

      await client.with(async () => {
        await expect(
          downloadChunk(client, {
            location: stubLocation,
            offset: 1023, // Will align down to 1024
            limit: 1048576, // After adding stripStart, will exceed 1MB
          }),
        ).rejects.toThrow(MtArgumentError)
      })
    })

    it('should throw error for web file locations', async () => {
      const client = createClient()
      const webLocation = createStub('inputWebFileLocation', {
        url: 'https://example.com/file',
        accessHash: Long.ZERO,
      })

      await client.with(async () => {
        await expect(
          downloadChunk(client, {
            location: webLocation,
            offset: 0,
            limit: 1024,
          }),
        ).rejects.toThrow(MtUnsupportedError)
      })
    })

    it('should throw error for inline file locations', async () => {
      const client = createClient()
      const inlineLocation = new FileLocation(new Uint8Array([1, 2, 3, 4]))

      await client.with(async () => {
        await expect(
          downloadChunk(client, {
            location: inlineLocation,
            offset: 0,
            limit: 1024,
          }),
        ).rejects.toThrow(MtArgumentError)
      })
    })
  })

  describe('dcId parameter', () => {
    it('should pass dcId to call method', async () => {
      const client = createClient()
      let capturedDcId: number | undefined

      const originalCall = client.call.bind(client)
      client.call = async function (req: any, opts?: any) {
        if (req._ === 'upload.getFile') {
          capturedDcId = opts?.dcId
        }
        return originalCall(req, opts)
      }

      await client.with(async () => {
        await downloadChunk(client, {
          location: stubLocation,
          offset: 0,
          limit: 1024,
          dcId: 2,
        })

        expect(capturedDcId).toBe(2)
      })
    })
  })

  describe('special offset/limit combinations', () => {
    it('should handle offset=1, limit=1', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 1,
          limit: 1,
        })

        expect(result.byteLength).toBe(1)
        expect(result).toEqual(defaultData.subarray(1, 2))
      })
    })

    it('should handle offset=0, limit=1', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 0,
          limit: 1,
        })

        expect(result.byteLength).toBe(1)
        expect(result).toEqual(defaultData.subarray(0, 1))
      })
    })

    it('should handle multiple of 1024 but not at boundaries', async () => {
      const client = createClient()

      await client.with(async () => {
        const result = await downloadChunk(client, {
          location: stubLocation,
          offset: 3072, // 3 * 1024
          limit: 5120, // 5 * 1024
        })

        expect(result.byteLength).toBe(5120)
        expect(result).toEqual(defaultData.subarray(3072, 3072 + 5120))
      })
    })
  })
})
