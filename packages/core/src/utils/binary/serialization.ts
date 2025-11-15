import type { mtp } from '@mtcute/tl'
import { Bytes, read, write } from '@fuman/io'
import { assert } from '@fuman/utils'
import { tl } from '@mtcute/tl'
import { TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'
import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlWriterMap } from '@mtcute/tl/binary/writer.js'
import { PeersIndex } from '../../highlevel/index.js'

/** Serialize a raw TL object to binary */
export function serializeObject(obj: tl.TlObject | mtp.TlObject): Uint8Array {
  return TlBinaryWriter.serializeObject(__tlWriterMap, obj)
}

/** Deserialize a binary TL object */
export function deserializeObject(data: Uint8Array): tl.TlObject | mtp.TlObject {
  return TlBinaryReader.deserializeObject(__tlReaderMap, data)
}

/** Helper function to serialize a {@link PeersIndex} */
export function serializePeersIndex({ users, chats }: PeersIndex): Uint8Array {
  const bytes = Bytes.alloc()

  write.int32le(bytes, users.size)
  for (const user of users.values()) {
    const data = serializeObject(user)
    write.int32le(bytes, data.length)
    write.bytes(bytes, data)
  }

  write.int32le(bytes, chats.size)
  for (const chat of chats.values()) {
    const data = serializeObject(chat)
    write.int32le(bytes, data.length)
    write.bytes(bytes, data)
  }

  return bytes.result()
}

/** Helper function to deserialize a {@link PeersIndex} */
export function deserializePeersIndex(data: Uint8Array): PeersIndex {
  const res = new PeersIndex()

  const bytes = Bytes.from(data)

  const userCount = read.int32le(bytes)
  for (let i = 0; i < userCount; i++) {
    const len = read.int32le(bytes)
    const obj = deserializeObject(read.exactly(bytes, len))
    assert(tl.isAnyUser(obj))
    res.users.set(obj.id, obj)
  }

  const chatCount = read.int32le(bytes)
  for (let i = 0; i < chatCount; i++) {
    const len = read.int32le(bytes)
    const obj = deserializeObject(read.exactly(bytes, len))
    assert(tl.isAnyChat(obj))
    res.chats.set(obj.id, obj)
  }

  return res
}
