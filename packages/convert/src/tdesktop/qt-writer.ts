import type { ISyncWritable } from '@fuman/io'
import type { Long } from '@mtcute/core'
import { write } from '@fuman/io'
import { u8 } from '@fuman/utils'

export function writeQByteArray(into: ISyncWritable, buf: Uint8Array): void {
  write.uint32be(into, buf.length)
  write.bytes(into, buf)
}

export function writeLong(into: ISyncWritable, long: Long): void {
  write.int32be(into, long.high)
  write.int32be(into, long.low)
}

export function writeCharArray(into: ISyncWritable, buf: Uint8Array): void {
  const bytes = u8.alloc(buf.length + 1)
  bytes.set(buf)
  bytes[buf.length] = 0

  writeQByteArray(into, bytes)
}

export function writeQString(into: ISyncWritable, str: string): void {
  const length = str.length * 2
  write.uint32be(into, length)

  for (let i = 0; i < length; i++) {
    write.uint16be(into, str.charCodeAt(i))
  }
}
