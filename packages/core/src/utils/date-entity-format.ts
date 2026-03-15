import type { tl } from '../tl/index.js'

export type DateEntityFlags = Omit<tl.RawMessageEntityFormattedDate, '_' | 'offset' | 'length' | 'date'>

/**
 * Parse a date-time entity format string into flags for `messageEntityFormattedDate`.
 *
 * Format string must match: `r|w?[dD]?[tT]?`
 *
 * Control characters:
 * - `r`: relative time (cannot be combined with others)
 * - `w`: day of the week
 * - `d`: short date (e.g. "17.03.22")
 * - `D`: long date (e.g. "March 17, 2022")
 * - `t`: short time (e.g. "22:45")
 * - `T`: long time (e.g. "22:45:00")
 *
 * Empty string means display text as-is, user can still see the underlying date.
 */
export function parseDateEntityFormat(format: string): DateEntityFlags {
  if (format === 'r' || format === 'R') {
    return { relative: true }
  }

  const result: DateEntityFlags = {}

  for (const c of format) {
    switch (c) {
      case 't':
        result.shortTime = true
        break
      case 'T':
        result.longTime = true
        break
      case 'd':
        result.shortDate = true
        break
      case 'D':
        result.longDate = true
        break
      case 'w':
      case 'W':
        result.dayOfWeek = true
        break
      default:
        throw new Error(`Invalid date format character: ${c}`)
    }
  }

  return result
}

/**
 * Convert `messageEntityFormattedDate` flags to a format string.
 *
 * @see {@link parseDateEntityFormat} for the format description
 */
export function dateEntityFormatToString(entity: DateEntityFlags): string {
  if (entity.relative) return 'r'

  let result = ''
  if (entity.dayOfWeek) result += 'w'
  if (entity.shortDate) result += 'd'
  if (entity.longDate) result += 'D'
  if (entity.shortTime) result += 't'
  if (entity.longTime) result += 'T'

  return result
}
