/**
 * Array that adds elements in sorted order.
 *
 * Comparator is always called like: comparator(itemFromSortedArray, yourItem)
 */
export class SortedArray<T> {
  readonly raw: T[]

  constructor(
    array: T[] = [],
    readonly comparator: (a: T, b: T) => number,
  ) {
    this.raw = array.sort(comparator)
    this.comparator = comparator
  }

  get length(): number {
    return this.raw.length
  }

  insert(item: T | T[]): number {
    if (Array.isArray(item)) {
      let ind = -1
      item.forEach((it) => {
        ind = this.insert(it)
      })

      return ind
    }

    if (this.raw.length === 0) {
      this.raw.push(item)

      return 0
    }

    // find insert position
    let lo = 0
    let hi = this.raw.length

    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)

      if (this.comparator(this.raw[mid], item) > 0) {
        hi = mid
      } else {
        lo = mid + 1
      }
    }

    this.raw.splice(lo, 0, item)

    return lo
  }

  // closest: return the closest value (right-hand side)
  // meaning that raw[idx - 1] <= item <= raw[idx]
  // in other words, smallest idx such that raw[idx] >= item
  index(item: T, closest = false): number {
    let lo = 0
    let hi = this.raw.length

    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)
      const cmp = this.comparator(this.raw[mid], item)

      if (cmp === 0) {
        return mid
      }
      if (cmp > 0) {
        hi = mid
      } else {
        lo = mid + 1
      }
    }

    return closest ? lo : -1
  }

  remove(item: T): void {
    const idx = this.index(item)
    if (idx === -1) return

    this.raw.splice(idx, 1)
  }

  removeIndex(idx: number): void {
    this.raw.splice(idx, 1)
  }

  includes(item: T): boolean {
    return this.index(item) !== -1
  }

  find(item: T): T | null {
    const ind = this.index(item)

    return ind === -1 ? null : this.raw[ind]
  }

  clear(): void {
    this.raw.length = 0
  }

  popFront(): T | undefined {
    return this.raw.shift()
  }
}
