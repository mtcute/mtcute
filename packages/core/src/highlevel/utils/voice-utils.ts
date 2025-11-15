import { typed, u8 } from '@fuman/utils'

/**
 * Decode 5-bit encoded voice message waveform into
 * an array of waveform values (0-32).
 *
 * @param wf  Encoded waveform
 */
export function decodeWaveform(wf: Uint8Array): number[] {
  const bitsCount = wf.length * 8
  const valuesCount = ~~(bitsCount / 5)

  if (!valuesCount) return []

  const lastIdx = valuesCount - 1

  // Read each 5 bit of encoded 5bit as 0-31 unsigned char.
  // We count the index of the byte in which the desired 5-bit sequence starts.
  // And then we read a uint16 starting from that byte to guarantee to get all of those 5 bits.
  //
  // BUT! if it is the last byte we have, we're not allowed to read a uint16 starting with it.
  // Because it will be an overflow (we'll access one byte after the available memory).
  // We see, that only the last 5 bits could start in the last available byte and be problematic.
  // So we read in a general way all the entries except the last one.

  const result: number[] = []
  const dv = typed.toDataView(wf)

  for (let i = 0, j = 0; i < lastIdx; i++, j += 5) {
    const byteIdx = ~~(j / 8)
    const bitShift = j % 8
    result[i] = (dv.getUint16(byteIdx, true) >> bitShift) & 0b11111
  }

  const lastByteIdx = ~~((lastIdx * 5) / 8)
  const lastBitShift = (lastIdx * 5) % 8
  const lastValue = lastByteIdx === wf.length - 1 ? wf[lastByteIdx] : dv.getUint16(lastByteIdx, true)
  result[lastIdx] = (lastValue >> lastBitShift) & 0b11111

  return result
}

/**
 * Encode an array of waveform values into
 * 5-bit encoded voice message waveform into
 *
 * @param wf  Waveform values
 */
export function encodeWaveform(wf: number[]): Uint8Array {
  const bitsCount = wf.length * 5
  const bytesCount = ~~((bitsCount + 7) / 8)
  const result = u8.alloc(bytesCount + 1)
  const dv = typed.toDataView(result)

  // Write each 0-31 unsigned char as 5 bit to result.
  // We reserve one extra byte to be able to dereference any of required bytes
  // as a uint16 without overflowing, even the byte with index "bytesCount - 1".

  for (let i = 0, j = 0; i < wf.length; i++, j += 5) {
    const byteIdx = ~~(j / 8)
    const bitShift = j % 8
    const value = (wf[i] & 0b11111) << bitShift

    // const old = result.readUInt16LE(byteIdx)
    // result.writeUInt16LE(old | value, byteIdx)
    dv.setUint16(byteIdx, dv.getUint16(byteIdx, true) | value, true)
  }

  return result.slice(0, bytesCount)
}
