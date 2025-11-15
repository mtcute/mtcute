import type { ISyncReadable } from '@fuman/io'
import { read } from '@fuman/io'
import { u8 } from '@fuman/utils'
import { Long } from '@mtcute/core'

export function readQByteArray(readable: ISyncReadable): Uint8Array {
  const length = read.uint32be(readable)
  if (length === 0 || length === 0xFFFFFFFF) {
    return u8.empty
  }

  return read.exactly(readable, length)
}

export function readLong(readable: ISyncReadable): Long {
  const high = read.int32be(readable)
  const low = read.int32be(readable)

  return new Long(low, high)
}

export function readCharArray(readable: ISyncReadable): Uint8Array {
  const buf = readQByteArray(readable)

  if (buf.length > 0) {
    // drop the last byte, which is always 0
    return buf.subarray(0, buf.length - 1)
  }
  return buf
}

const u16Decoder = new TextDecoder('utf-16be')
export function readQString(readable: ISyncReadable): string {
  const bytes = readQByteArray(readable)
  return u16Decoder.decode(bytes)
}
