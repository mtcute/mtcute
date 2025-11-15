import { Bytes, write } from '@fuman/io'
import { hex } from '@fuman/utils'
import { defaultTestCryptoProvider, useFakeMathRandom } from '@mtcute/test'
// todo: fix test
import { describe, expect, it } from 'vitest'

import { TransportError } from './abstract.js'
import { IntermediatePacketCodec, PaddedIntermediatePacketCodec } from './intermediate.js'

describe('IntermediatePacketCodec', () => {
  it('should return correct tag', () => {
    expect(hex.encode(new IntermediatePacketCodec().tag())).eq('eeeeeeee')
  })

  it('should correctly parse immediate framing', async () => {
    const codec = new IntermediatePacketCodec()
    expect(codec.decode(Bytes.from(hex.decode('050000000501020304')), false)).eql(new Uint8Array([5, 1, 2, 3, 4]))
  })

  it('should correctly parse incomplete framing', () => {
    const codec = new IntermediatePacketCodec()
    const buf = Bytes.alloc()

    write.bytes(buf, hex.decode('050000000501'))
    expect(codec.decode(buf, false)).toEqual(null)

    write.bytes(buf, hex.decode('020304'))
    expect(codec.decode(buf, false)).eql(new Uint8Array([5, 1, 2, 3, 4]))
    expect(codec.decode(buf, false)).toEqual(null)
  })

  it('should correctly parse multiple streamed packets', () => {
    const codec = new IntermediatePacketCodec()
    const buf = Bytes.alloc()

    write.bytes(buf, hex.decode('050000000501'))
    expect(codec.decode(buf, false)).toEqual(null)
    write.bytes(buf, hex.decode('020304050000'))
    expect(codec.decode(buf, false)).eql(new Uint8Array([5, 1, 2, 3, 4]))
    expect(codec.decode(buf, false)).eql(null)

    write.bytes(buf, hex.decode('000301020301'))
    expect(codec.decode(buf, false)).eql(new Uint8Array([3, 1, 2, 3, 1]))
    expect(codec.decode(buf, false)).toEqual(null)
  })

  it('should correctly parse transport errors', () => {
    const codec = new IntermediatePacketCodec()
    const buf = Bytes.alloc()

    write.bytes(buf, hex.decode('040000006cfeffff'))
    expect(() => codec.decode(buf, false)).toThrow(new TransportError(404))
  })

  it('should correctly frame packets', () => {
    const data = hex.decode('6cfeffff')
    const buf = Bytes.alloc()

    new IntermediatePacketCodec().encode(data, buf)

    expect(hex.encode(buf.result())).toEqual('040000006cfeffff')
  })
})

describe('PaddedIntermediatePacketCodec', () => {
  useFakeMathRandom()

  const create = async () => {
    const codec = new PaddedIntermediatePacketCodec()
    codec.setup!(await defaultTestCryptoProvider())

    return codec
  }

  it('should return correct tag', async () => {
    expect(hex.encode((await create()).tag())).eq('dddddddd')
  })

  it('should correctly frame packets', async () => {
    const data = hex.decode('6cfeffff')
    const buf = Bytes.alloc()

        ;(await create()).encode(data, buf)

    expect(hex.encode(buf.result())).toEqual('0a0000006cfeffff29afd26df40f')
  })
})
