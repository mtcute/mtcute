// tdlib's RLE only encodes consecutive \x00

export function telegramRleEncode(buf: Uint8Array): Uint8Array {
  const len = buf.length
  const ret: number[] = []
  let count = 0

  for (let i = 0; i < len; i++) {
    const cur = buf[i]

    if (cur === 0) {
      count += 1
    } else {
      if (count > 0) {
        ret.push(0, count)
        count = 0
      }

      ret.push(cur)
    }
  }

  if (count > 0) {
    ret.push(0, count)
  }

  return new Uint8Array(ret)
}

export function telegramRleDecode(buf: Uint8Array): Uint8Array {
  const len = buf.length
  const ret: number[] = []
  let prev = -1

  for (let i = 0; i < len; i++) {
    const cur = buf[i]

    if (prev === 0) {
      for (let j = 0; j < cur; j++) {
        ret.push(prev)
      }
      prev = -1
    } else {
      if (prev !== -1) ret.push(prev)
      prev = cur
    }
  }

  if (prev !== -1) ret.push(prev)

  return new Uint8Array(ret)
}

export function assertNever(_: never): never {
  throw new Error('unreachable')
}
