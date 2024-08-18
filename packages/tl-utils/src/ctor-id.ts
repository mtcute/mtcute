import CRC32 from 'crc-32'

import { writeTlEntryToString } from './stringify.js'
import type { TlEntry } from './types.js'

/**
 * Computes the constructor id for a given TL entry.
 *
 * @param entry  TL entry
 */
export function computeConstructorIdFromEntry(entry: TlEntry): number {
    const str = writeTlEntryToString(entry, true)

    return CRC32.str(str) >>> 0
}
