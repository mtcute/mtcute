import Long from 'long'
import { getRandomInt } from './misc-utils'

export function randomLong(unsigned = false): Long {
    const lo = getRandomInt(0xffffffff)
    const hi = getRandomInt(0xffffffff)

    return new Long(lo, hi, unsigned)
}

export function removeFromLongArray(arr: Long[], val: Long): boolean {
    for (let i = 0; i < arr.length; i++) {
        const v = arr[i]
        // v === val for the case when the exact same object was passed
        if (v === val || v.eq(val)) {
            arr.splice(i, 1)
            return true
        }
    }

    return false
}

/**
 * Serialize a Long (int64) to its fast string representation:
 * `$high|$low`.
 *
 * This method is about 500* times faster than using `Long.toString()`,
 * and very useful when the string will only ever be used internally
 * (e.g. for keying a map)
 *
 * _\* benchmark result, YMMV_
 *
 * @param val
 */
export function longToFastString(val: Long): string {
    return `${val.low}|${val.high}`
}

/**
 * Parse a Long (int64) from its fast string representation:
 * `$high|$low`.
 *
 * This method is about 2 times faster than using Long.fromString.
 *
 * @param val
 * @param unsigned
 */
export function longFromFastString(val: string, unsigned = false): Long {
    const parts = val.split('|')

    if (parts.length !== 2) throw new Error(`Invalid long fast string: ${val}`)
    const low = parseInt(parts[0])
    const high = parseInt(parts[1])

    if (isNaN(low) || isNaN(high))
        throw new Error(`Invalid long fast string: ${val}`)

    return new Long(low, high, unsigned)
}


/**
 * Map with Longs as key.
 *
 * Uses fast string representation internally.
 */
export class LongMap<V> {
    private _map?: Map<string, V>
    private _obj?: any

    constructor(useObject = false) {
        if (typeof Map === 'undefined' || useObject) {
            this._obj = Object.create(null)
            this.set = this._setForObj.bind(this)
            this.has = this._hasForObj.bind(this)
            this.get = this._getForObj.bind(this)
            this.delete = this._deleteForObj.bind(this)
            this.keys = this._keysForObj.bind(this)
            this.values = this._valuesForObj.bind(this)
            this.clear = this._clearForObj.bind(this)
            this.size = this._sizeForObj.bind(this)
        } else {
            this._map = new Map()
            this.set = this._setForMap.bind(this)
            this.has = this._hasForMap.bind(this)
            this.get = this._getForMap.bind(this)
            this.delete = this._deleteForMap.bind(this)
            this.keys = this._keysForMap.bind(this)
            this.values = this._valuesForMap.bind(this)
            this.clear = this._clearForMap.bind(this)
            this.size = this._sizeForMap.bind(this)
        }
    }

    readonly set: (key: Long, value: V) => void
    readonly has: (key: Long) => boolean
    readonly get: (key: Long) => V | undefined
    readonly delete: (key: Long) => void
    readonly keys: (unsigned?: boolean) => IterableIterator<Long>
    readonly values: () => IterableIterator<V>
    readonly clear: () => void
    readonly size: () => number

    private _setForMap(key: Long, value: V): void {
        this._map!.set(longToFastString(key), value)
    }

    private _hasForMap(key: Long): boolean {
        return this._map!.has(longToFastString(key))
    }

    private _getForMap(key: Long): V | undefined {
        return this._map!.get(longToFastString(key))
    }

    private _deleteForMap(key: Long): void {
        this._map!.delete(longToFastString(key))
    }

    private *_keysForMap(unsigned?: boolean): IterableIterator<Long> {
        for (const v of this._map!.keys()) {
            yield longFromFastString(v, unsigned)
        }
    }

    private _valuesForMap(): IterableIterator<V> {
        return this._map!.values()
    }

    private _clearForMap(): void {
        this._map!.clear()
    }

    private _sizeForMap(): number {
        return this._map!.size
    }

    private _setForObj(key: Long, value: V): void {
        this._obj![longToFastString(key)] = value
    }

    private _hasForObj(key: Long): boolean {
        return longToFastString(key) in this._obj!
    }

    private _getForObj(key: Long): V | undefined {
        return this._obj![longToFastString(key)]
    }

    private _deleteForObj(key: Long): void {
        delete this._obj![longToFastString(key)]
    }

    private *_keysForObj(unsigned?: boolean): IterableIterator<Long> {
        for (const v of Object.keys(this._obj)) {
            yield longFromFastString(v, unsigned)
        }
    }

    private *_valuesForObj(): IterableIterator<V> {
        yield * (Object.values(this._obj!) as any)
    }

    private _clearForObj(): void {
        this._obj = {}
    }

    private _sizeForObj(): number {
        return Object.keys(this._obj).length
    }
}

/**
 * Set for Longs.
 *
 * Uses fast string representation internally
 */
export class LongSet {
    private _set?: Set<string>
    private _obj?: any
    private _objSize?: number

    constructor(useObject = false) {
        if (typeof Set === 'undefined' || useObject) {
            this._obj = Object.create(null)
            this._objSize = 0
            this.add = this._addForObj.bind(this)
            this.delete = this._deleteForObj.bind(this)
            this.has = this._hasForObj.bind(this)
            this.clear = this._clearForObj.bind(this)
        } else {
            this._set = new Set()
            this.add = this._addForSet.bind(this)
            this.delete = this._deleteForSet.bind(this)
            this.has = this._hasForSet.bind(this)
            this.clear = this._clearForSet.bind(this)
        }
    }

    readonly add: (val: Long) => void
    readonly delete: (val: Long) => void
    readonly has: (val: Long) => boolean
    readonly clear: () => void

    get size(): number {
        return this._objSize ?? this._set!.size
    }

    private _addForSet(val: Long) {
        this._set!.add(longToFastString(val))
    }

    private _deleteForSet(val: Long) {
        this._set!.delete(longToFastString(val))
    }

    private _hasForSet(val: Long) {
        return this._set!.has(longToFastString(val))
    }

    private _clearForSet() {
        this._set!.clear()
    }

    private _addForObj(val: Long) {
        const k = longToFastString(val)
        if (k in this._obj!) return

        this._obj![k] = true
        this._objSize! += 1
    }

    private _deleteForObj(val: Long) {
        const k = longToFastString(val)
        if (!(k in this._obj!)) return

        delete this._obj![k]
        this._objSize! -= 1
    }

    private _hasForObj(val: Long) {
        return longToFastString(val) in this._obj!
    }

    private _clearForObj() {
        this._obj = {}
        this._objSize = 0
    }
}
