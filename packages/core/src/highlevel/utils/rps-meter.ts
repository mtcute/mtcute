import { Deque } from '@fuman/utils'

export class RpsMeter {
  _hits: Deque<bigint>
  time: bigint

  constructor(
    readonly size = 500,
    time = 5000,
  ) {
    if (typeof process === 'undefined' || !process.hrtime.bigint) {
      throw new Error('RPS meter is not supported on this platform')
    }

    this._hits = new Deque<bigint>(undefined, { capacity: size })
    this.time = BigInt(time) * BigInt(1e6)
  }

  hit(): void {
    this._hits.pushBack(process.hrtime.bigint())
  }

  getRps(): number {
    // calculate average load based on last `size` hits in the last `time` ms
    if (!this._hits.length) return 0 // no hits at all

    const now = process.hrtime.bigint()
    const window = now - this.time
    // find the first hit within the last `time` ms
    const iter = this._hits[Symbol.iterator]()
    let first = iter.next()
    let idx = 0

    while (!first.done && first.value < window) {
      first = iter.next()
      idx += 1
    }
    if (!first.value) return 0 // no recent hits

    // number of hits within the window
    const hits = this._hits.length - idx

    // average load per second
    return (hits * 1e9) / Number(now - first.value)
  }
}
