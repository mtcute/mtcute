import type { UploadFileLike } from '@mtcute/core'
import { ReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { basename } from 'node:path'

import { Readable as NodeReadable } from 'node:stream'
import { extractFileName } from '@mtcute/core/utils.js'

export async function normalizeFile(file: UploadFileLike): Promise<{
  file: UploadFileLike
  fileName?: string | undefined
  fileSize?: number
} | null> {
  if (typeof file === 'string') {
    const fd = await Deno.open(file, { read: true })

    return {
      file: fd.readable,
      fileSize: (await fd.stat()).size,
      fileName: extractFileName(file),
    }
  }

  if (file instanceof Deno.FsFile) {
    const stat = await file.stat()

    return {
      file: file.readable,
      // https://github.com/denoland/deno/issues/23591
      // fileName: ...,
      fileSize: stat.size,
    }
  }

  // while these are not Deno-specific, they still may happen
  if (file instanceof ReadStream) {
    const fileName = basename(file.path.toString())
    const fileSize = await stat(file.path.toString()).then(stat => stat.size)

    return {
      file: NodeReadable.toWeb(file) as unknown as ReadableStream<Uint8Array>,
      fileName,
      fileSize,
    }
  }

  if (file instanceof NodeReadable) {
    return {
      file: NodeReadable.toWeb(file) as unknown as ReadableStream<Uint8Array>,
    }
  }

  return null
}
