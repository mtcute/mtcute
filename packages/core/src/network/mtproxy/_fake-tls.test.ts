import type { ISyncWritable } from '@fuman/io'
import type { IPacketCodec } from '../transports/index.js'
import { Bytes, write } from '@fuman/io'
import { u8 } from '@fuman/utils'
import { defaultTestCryptoProvider } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

import { FakeTlsPacketCodec } from './_fake-tls.js'

// A stand-in for ObfuscatedPacketCodec(IntermediatePacketCodec): an AES-CTR
// stream cipher (stateful across the whole connection, like the real obfuscation
// layer) over a uint32le length-prefixed framer. AES-CTR is non-rewindable, so
// this reproduces the corruption the buggy decode caused by rewinding a record
// it had already fed to the inner codec — a stateless inner would not surface it.
async function makeStatefulInner(): Promise<IPacketCodec> {
  const crypto = await defaultTestCryptoProvider()
  const key = new Uint8Array(32).fill(0x2B)
  const iv = new Uint8Array(16).fill(0x17)
  const enc = crypto.createAesCtr(key, iv, true)
  const dec = crypto.createAesCtr(key, iv, false)
  let acc = new Uint8Array(0)

  return {
    setup() {},
    tag: async () => new Uint8Array(0),
    reset() {},
    async encode(packet: Uint8Array, into: ISyncWritable): Promise<void> {
      const framed = new Uint8Array(4 + packet.length)
      new DataView(framed.buffer).setUint32(0, packet.length, true)
      framed.set(packet, 4)
      write.bytes(into, enc.process(framed))
    },
    async decode(reader: Bytes): Promise<Uint8Array | null> {
      if (reader.available > 0) {
        acc = u8.concat2(acc, dec.process(reader.readSync(reader.available)))
      }
      if (acc.length < 4) return null
      const length = new DataView(acc.buffer, acc.byteOffset, acc.byteLength).getUint32(0, true)
      if (acc.length - 4 < length) return null
      const out = acc.slice(4, 4 + length)
      acc = acc.slice(4 + length)
      return out
    },
  } as unknown as IPacketCodec
}

async function encodeToWire(...packets: Uint8Array[]): Promise<Uint8Array> {
  const codec = new FakeTlsPacketCodec(await makeStatefulInner())
  // Set `_tag` to empty so encode does not prepend the obfuscation handshake tag
  // (in the real flow that is exchanged out of band, never inside a framed payload).
  await codec.tag()
  const into = Bytes.alloc(packets.reduce((n, p) => n + p.length, 0) + 256)
  for (const p of packets) await codec.encode(p, into)
  return into.result().slice()
}

// Mirrors @fuman/io FramedReader.read: append a chunk, drain frames via
// decode()+reclaim() until decode returns null, then read the next chunk.
async function decodeFrames(chunks: Uint8Array[]): Promise<Uint8Array[]> {
  const codec = new FakeTlsPacketCodec(await makeStatefulInner())
  const buffer = Bytes.alloc(64)
  const frames: Uint8Array[] = []
  for (const chunk of chunks) {
    write.bytes(buffer, chunk)
    for (;;) {
      const frame = await codec.decode(buffer, false)
      buffer.reclaim()
      if (frame === null) break
      frames.push(frame)
    }
  }
  return frames
}

function pattern(size: number, seed = 0): Uint8Array {
  const b = new Uint8Array(size)
  for (let i = 0; i < size; i++) b[i] = (i * 31 + seed) % 251
  return b
}

function splitInto(wire: Uint8Array, chunk: number): Uint8Array[] {
  const out: Uint8Array[] = []
  for (let i = 0; i < wire.length; i += chunk) out.push(wire.subarray(i, Math.min(i + chunk, wire.length)))
  return out
}

describe('FakeTlsPacketCodec', () => {
  it('round-trips a small response that fits in one TLS record', async () => {
    const packet = pattern(120)
    const frames = await decodeFrames([await encodeToWire(packet)])
    expect(frames).toHaveLength(1)
    expect(frames[0]).toEqual(packet)
  })

  it('round-trips a large response spanning multiple coalesced TLS records', async () => {
    // 8000 > MAX_TLS_PACKET_LENGTH (2878) → encode slices it into several records.
    const packet = pattern(8000)
    const wire = await encodeToWire(packet)
    expect(wire.length).toBeGreaterThan(2878 * 2)
    const frames = await decodeFrames([wire]) // all records arrive coalesced
    expect(frames).toHaveLength(1)
    expect(frames[0]).toEqual(packet)
  })

  it('round-trips a multi-record response split across reads (records cut mid-stream)', async () => {
    const packet = pattern(20000, 5)
    // 777 is coprime with the record stride, so reads land mid-header and mid-payload.
    const frames = await decodeFrames(splitInto(await encodeToWire(packet), 777))
    expect(frames).toHaveLength(1)
    expect(frames[0]).toEqual(packet)
  })

  it('reassembles a multi-record frame delivered byte by byte', async () => {
    const packet = pattern(6000, 9)
    const frames = await decodeFrames(splitInto(await encodeToWire(packet), 1))
    expect(frames).toHaveLength(1)
    expect(frames[0]).toEqual(packet)
  })

  it('decodes two consecutive frames in order', async () => {
    const a = pattern(5000, 1)
    const b = pattern(3500, 2)
    const frames = await decodeFrames([await encodeToWire(a, b)])
    expect(frames).toHaveLength(2)
    expect(frames[0]).toEqual(a)
    expect(frames[1]).toEqual(b)
  })
})
