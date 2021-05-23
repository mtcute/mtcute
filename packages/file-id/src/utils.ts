// telegram has some cursed RLE which only encodes consecutive \x00

export function telegramRleEncode(buf: Buffer): Buffer {
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

    return Buffer.from(ret)
}

export function telegramRleDecode(buf: Buffer): Buffer {
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
    return Buffer.from(ret)
}
