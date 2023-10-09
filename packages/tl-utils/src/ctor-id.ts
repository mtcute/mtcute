import CRC32 from 'crc-32'

import { writeTlEntryToString } from './stringify'
import { TlEntry } from './types'

/**
 * Computes the constructor id for a given TL entry.
 *
 * @param entry  TL entry
 */
export function computeConstructorIdFromEntry(entry: TlEntry): number {
    return CRC32.str(writeTlEntryToString(entry, true)) >>> 0
}
