import CRC32 from 'crc-32'

import { parseTlToEntries } from './parse'
import { writeTlEntryToString } from './stringify'
import { TlEntry } from './types'

/**
 * Computes the constructor id for a given TL entry string.
 *
 * @param line  Line containing TL entry definition
 */
export function computeConstructorIdFromString(line: string): number {
    return computeConstructorIdFromEntry(parseTlToEntries(line, { forIdComputation: true })[0])
}

/**
 * Computes the constructor id for a given TL entry.
 *
 * @param entry  TL entry
 */
export function computeConstructorIdFromEntry(entry: TlEntry): number {
    return CRC32.str(writeTlEntryToString(entry, true)) >>> 0
}
