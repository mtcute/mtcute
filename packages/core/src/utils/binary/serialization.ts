import type { tl } from '@mtcute/tl'
import { TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'
import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlWriterMap } from '@mtcute/tl/binary/writer.js'

export function serializeObject(obj: tl.TlObject): Uint8Array {
    return TlBinaryWriter.serializeObject(__tlWriterMap, obj)
}

export function deserializeObject(data: Uint8Array): tl.TlObject {
    return TlBinaryReader.deserializeObject(__tlReaderMap, data)
}
