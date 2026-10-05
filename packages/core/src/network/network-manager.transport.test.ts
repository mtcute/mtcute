import type { Socket } from 'node:net'
import type { mtp, tl } from '../tl/index.js'
import type { ITelegramConnection, TelegramTransport } from './transports/abstract.js'
import { createServer } from 'node:net'
import { typed, u8 } from '@fuman/utils'
import { createStub, defaultCryptoProvider, StubTelegramClient } from '@mtcute/test'
import { TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'
import Long from 'long'
import { describe, expect, it, vi } from 'vitest'
import { TcpTransport } from '../../../node/src/utils/tcp.js'
import { __tlReaderMap } from '../tl/binary/reader.js'
import { __tlWriterMap } from '../tl/binary/writer.js'
import { createAesIgeForMessage } from '../utils/crypto/mtproto.js'
import { IntermediatePacketCodec } from './transports/intermediate.js'

async function createServerEmulator() {
  const sockets = new Set<Socket>()
  const errors: unknown[] = []
  let connections = 0
  let responses = 0
  let messageId = Long.fromNumber(Math.floor(Date.now() / 1000)).shiftLeft(32).or(1)
  const key = new Uint8Array(256)
  const crypto = defaultCryptoProvider
  const nearestDc = TlBinaryWriter.serializeObject(__tlWriterMap, createStub('nearestDc', {
    country: 'XX',
    thisDc: 2,
    nearestDc: 2,
  }))
  const nearestDcRequest = TlBinaryWriter.serializeObject(__tlWriterMap, { _: 'help.getNearestDc' })
  const configRequest = TlBinaryWriter.serializeObject(__tlWriterMap, { _: 'help.getConfig' })
  let dcOptions: tl.RawDcOption[] = []

  const server = createServer((socket) => {
    connections += 1
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
    socket.on('error', err => errors.push(err))
    let buffered: Uint8Array = new Uint8Array()
    let tagged = false

    socket.on('data', (chunk) => {
      try {
        buffered = u8.concat2(buffered, chunk)
        if (!tagged) {
          if (buffered.length < 4) return
          expect([...buffered.subarray(0, 4)]).toEqual([0xEE, 0xEE, 0xEE, 0xEE])
          buffered = buffered.subarray(4)
          tagged = true
        }
        while (buffered.length >= 4) {
          const size = typed.toDataView(buffered).getUint32(0, true)
          if (buffered.length < size + 4) return
          const packet = buffered.subarray(4, size + 4)
          buffered = buffered.subarray(size + 4)
          const msgKey = packet.subarray(8, 24)
          const plain = createAesIgeForMessage(crypto, key, msgKey, true).decrypt(packet.subarray(24))
          expect(packet.subarray(0, 8)).toEqual(crypto.sha1(key).subarray(-8))
          expect(msgKey).toEqual(crypto.sha256(u8.concat2(key.subarray(88, 120), plain)).subarray(8, 24))
          const reader = new TlBinaryReader(__tlReaderMap, plain)
          const salt = reader.long()
          const sessionId = reader.long()

          const respond = (body: Uint8Array): void => {
            messageId = messageId.add(4)
            const padding = 12 + (16 - (32 + body.length + 12) % 16) % 16
            const writer = TlBinaryWriter.alloc(__tlWriterMap, 32 + body.length + padding)
            writer.long(salt)
            writer.long(sessionId)
            writer.long(messageId)
            writer.int(1)
            writer.uint(body.length)
            writer.raw(body)
            writer.raw(crypto.randomBytes(padding))
            const data = writer.result()
            const messageKey = crypto.sha256(u8.concat2(key.subarray(96, 128), data)).subarray(8, 24)
            const encrypted = createAesIgeForMessage(crypto, key, messageKey, false).encrypt(data)
            const frame = u8.concat3(crypto.sha1(key).subarray(-8), messageKey, encrypted)
            const prefix = new Uint8Array(4)
            typed.toDataView(prefix).setUint32(0, frame.length, true)
            socket.write(u8.concat2(prefix, frame))
            responses += 1
          }

          const processMessage = (message: TlBinaryReader): void => {
            const reqMsgId = message.long()
            message.uint()
            const body = message.raw(message.uint())
            const inner = new TlBinaryReader(__tlReaderMap, body)
            const constructor = inner.uint()
            if (constructor === 0x73F1F8DC) {
              const count = inner.uint()
              for (let i = 0; i < count; i++) processMessage(inner)
              return
            }
            let result: Uint8Array | undefined
            const tail = body.subarray(-4)
            if (typed.equal(tail, nearestDcRequest)) result = nearestDc
            if (typed.equal(tail, configRequest)) {
              result = TlBinaryWriter.serializeObject(__tlWriterMap, createStub('config', {
                expires: Math.floor(Date.now() / 1000) + 3600,
                dcOptions,
              }))
            }
            if (result) {
              const rpc = TlBinaryWriter.alloc(__tlWriterMap, 12 + result.length)
              rpc.uint(0xF35C6D01)
              rpc.long(reqMsgId)
              rpc.raw(result)
              respond(rpc.result())
            } else if (constructor === 0xF3427B8C) {
              const pingId = inner.long()
              const pong: mtp.RawMt_pong = { _: 'mt_pong', msgId: reqMsgId, pingId }
              respond(TlBinaryWriter.serializeObject(__tlWriterMap, pong))
            }
          }
          processMessage(reader)
        }
      } catch (err) {
        errors.push(err)
        socket.destroy()
      }
    })
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected TCP address')
  const dc = { id: 2, ipAddress: '127.0.0.1', port: address.port }
  dcOptions = [
    { _: 'dcOption', ...dc },
    { _: 'dcOption', ...dc, id: 5, port: 0 },
    { _: 'dcOption', ...dc, id: 5 },
  ]
  const transport: TelegramTransport = {
    connect: (option, signal) => new TcpTransport().connect({ ...option, port: dc.port }, signal),
    packetCodec: () => new IntermediatePacketCodec(),
  }
  return {
    dc,
    transport,
    sockets,
    errors,
    get connections() { return connections },
    get responses() { return responses },
    async close() {
      for (const socket of sockets) socket.destroy()
      await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()))
    },
  }
}

async function callNearestDc(client: StubTelegramClient, kind: 'main' | 'download' = 'main', dcId = 2) {
  return client.call({ _: 'help.getNearestDc' }, { kind, dcId, timeout: 5000 })
}

describe('NetworkManager with emulated TCP servers', () => {
  it('should preserve idle pools and exchange RPCs after repeated transport changes', async () => {
    const first = await createServerEmulator()
    const second = await createServerEmulator()
    const client = new StubTelegramClient({
      defaultDcs: { main: first.dc, media: first.dc },
      transport: first.transport,
      network: { floodControl: false },
    })
    try {
      await client.connect()
      expect((await callNearestDc(client)).country).toBe('XX')
      await client.mt.network.changeTransport(second.transport)
      expect((await callNearestDc(client)).country).toBe('XX')
      expect(second.connections).toBe(1)
      expect((await callNearestDc(client, 'download')).country).toBe('XX')
      expect(second.connections).toBe(2)
      await client.mt.network.changeTransport(first.transport)
      expect((await callNearestDc(client)).country).toBe('XX')
      expect((await callNearestDc(client, 'download')).country).toBe('XX')
      expect(first.connections).toBe(3)
      expect(first.errors).toEqual([])
      expect(second.errors).toEqual([])
    } finally {
      await client.destroy()
      await first.close()
      await second.close()
    }
  })

  it('should stay offline when changing transport, then recover on network-up', async () => {
    const first = await createServerEmulator()
    const second = await createServerEmulator()
    const client = new StubTelegramClient({
      defaultDcs: { main: first.dc, media: first.dc },
      transport: first.transport,
      network: { floodControl: false },
    })
    try {
      await client.connect()
      await callNearestDc(client)
      client.mt.network.notifyNetworkChanged(false)
      await vi.waitFor(() => expect(first.sockets.size).toBe(0))
      await client.mt.network.changeTransport(second.transport)
      expect(second.connections).toBe(0)
      client.mt.network.notifyNetworkChanged(true)
      expect((await callNearestDc(client)).country).toBe('XX')
      expect(second.connections).toBe(1)
      expect(second.errors).toEqual([])
    } finally {
      await client.destroy()
      await first.close()
      await second.close()
    }
  })

  it('should abort a stalled connect and deliver its queued RPC over the replacement transport', async () => {
    const server = await createServerEmulator()
    const signals: AbortSignal[] = []
    const transport: TelegramTransport = {
      connect: (_, signal) => {
        signals.push(signal)
        return new Promise<ITelegramConnection>((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), { once: true })
        })
      },
      packetCodec: () => new IntermediatePacketCodec(),
    }
    const client = new StubTelegramClient({
      defaultDcs: { main: server.dc, media: server.dc },
      transport,
      network: { floodControl: false },
    })
    try {
      await client.connect()
      const rpc = callNearestDc(client)
      await vi.waitFor(() => expect(signals).toHaveLength(1))
      await client.mt.network.changeTransport(server.transport)
      expect((await rpc).country).toBe('XX')
      expect(signals[0].aborted).toBe(true)
      expect(server.connections).toBe(1)
      expect(server.errors).toEqual([])
    } finally {
      await client.destroy()
      await server.close()
    }
  })

  it('should fall back after TCP refusal and recover after server-side socket loss', async () => {
    const server = await createServerEmulator()
    const attempts: string[] = []
    const transport: TelegramTransport = {
      connect: (dc, signal) => {
        attempts.push(`${dc.id}:${dc.ipAddress}:${dc.port}`)
        return new TcpTransport().connect(dc, signal)
      },
      packetCodec: () => new IntermediatePacketCodec(),
    }
    const client = new StubTelegramClient({
      defaultDcs: { main: server.dc, media: server.dc },
      transport,
      network: { floodControl: false },
      reconnectionStrategy: () => 0,
    })
    try {
      await client.connect()
      expect((await callNearestDc(client, 'main', 5)).country).toBe('XX')
      expect(attempts).toContain('5:127.0.0.1:0')
      expect(attempts).toContain(`5:127.0.0.1:${server.dc.port}`)
      expect((await callNearestDc(client, 'download', 5)).country).toBe('XX')
      expect(attempts.filter(it => it === '5:127.0.0.1:0')).toHaveLength(1)
      const before = server.connections
      for (const socket of server.sockets) socket.destroy()
      await vi.waitFor(() => expect(server.connections).toBeGreaterThan(before))
      expect((await callNearestDc(client, 'main', 5)).country).toBe('XX')
      expect(server.errors).toEqual([])
    } finally {
      await client.destroy()
      await server.close()
    }
  }, 15_000)
  it('should time out a blackholed address and complete the queued RPC on its fallback', async () => {
    const server = await createServerEmulator()
    const signals: AbortSignal[] = []
    const transport: TelegramTransport = {
      connect: (dc, signal) => {
        if (dc.port !== 0) return new TcpTransport().connect(dc, signal)
        signals.push(signal)
        return new Promise<ITelegramConnection>((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), { once: true })
        })
      },
      packetCodec: () => new IntermediatePacketCodec(),
    }
    const client = new StubTelegramClient({
      defaultDcs: { main: server.dc, media: server.dc },
      transport,
      network: { floodControl: false },
      reconnectionStrategy: () => 0,
    })
    try {
      await client.connect()
      const rpc = client.call({ _: 'help.getNearestDc' }, { dcId: 5, timeout: 30_000 })
      expect((await rpc).country).toBe('XX')
      expect(signals).toHaveLength(1)
      expect(signals[0].aborted).toBe(true)
      expect(signals[0].reason.message).toContain('15000')
      expect(server.connections).toBe(2)
      expect((await callNearestDc(client, 'main', 5)).country).toBe('XX')
      expect(server.errors).toEqual([])
    } finally {
      await client.destroy()
      await server.close()
    }
  }, 35_000)
})
