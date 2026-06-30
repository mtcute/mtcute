import type Long from 'long'
import { compareLongs } from '../utils/long-utils.js'
import { SortedArray } from '../utils/sorted-array.js'

const MAX_SAVED_MESSAGE_IDS = 1000

export class MessageIdStore {
  private _ids: SortedArray<Long> = new SortedArray<Long>([], compareLongs)

  add(msgId: Long): boolean {
    const ids = this._ids

    if (ids.index(msgId) !== -1) return false
    if (ids.length >= MAX_SAVED_MESSAGE_IDS && compareLongs(ids.raw[0], msgId) > 0) {
      return false
    }

    ids.insert(msgId)
    if (ids.length > MAX_SAVED_MESSAGE_IDS) ids.raw.shift()

    return true
  }

  has(msgId: Long): boolean {
    return this._ids.index(msgId) !== -1
  }

  clear(): void {
    this._ids.clear()
  }
}
