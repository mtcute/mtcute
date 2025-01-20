import type { TlEntry } from './types.js'

import crc32 from 'crc/calculators/crc32'
import { writeTlEntryToString } from './stringify.js'

/**
 * Computes the constructor id for a given TL entry.
 *
 * @param entry  TL entry
 */
export function computeConstructorIdFromEntry(entry: TlEntry): number {
    const str = writeTlEntryToString(entry, true)

    return crc32(new TextEncoder().encode(str)) >>> 0
}
