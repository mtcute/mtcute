import CRC32 from 'crc-32'

import { writeTlEntryToString } from './stringify'
import { TlEntry } from './types'

/**
 * Computes the constructor id for a given TL entry string.
 *
 * @param line  Line containing TL entry definition
 */
export function computeConstructorIdFromString(line: string): number {
    return (
        CRC32.str(
            // normalize
            line
                .replace(
                    /[{};]|[a-zA-Z0-9_]+:flags\.[0-9]+\?true|#[0-9a-f]{1,8}/g,
                    '',
                )
                .replace(/[<>]/g, ' ')
                .replace(/ +/g, ' ')
                .replace(':bytes', ':string')
                .trim(),
        ) >>> 0
    )
}

/**
 * Computes the constructor id for a given TL entry.
 *
 * @param entry  TL entry
 */
export function computeConstructorIdFromEntry(entry: TlEntry): number {
    return CRC32.str(writeTlEntryToString(entry, true)) >>> 0
}
