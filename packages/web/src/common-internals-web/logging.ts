const BASE_FORMAT = '%s [%c%s%c] [%c%s%c] '
const LEVEL_NAMES = [
  '', // OFF
  'ERR',
  'WRN',
  'INF',
  'DBG',
  'VRB',
]
const COLORS = [
  '', // OFF
  'color: #7a5f9d',
  'color: #8d7041',
  'color: #396c9e',
  'color: #437761',
  'color: #7a5f9d',
]
const TAG_COLORS = [
  'color: #437761',
  'color: #537a36',
  'color: #8d7041',
  'color: #396c9e',
  'color: #7a5f9d',
  'color: #7a5f9d',
]

/** @internal */
export const defaultLoggingHandler: (
  color: number,
  level: number,
  tag: string,
  fmt: string,
  args: unknown[],
) => void = (color: number, level: number, tag: string, fmt: string, args: unknown[]): void => {
  // eslint-disable-next-line no-console
  console.log(
    BASE_FORMAT + fmt,
    new Date().toISOString(),
    COLORS[level],
    LEVEL_NAMES[level],
    '',
    TAG_COLORS[color],
    tag,
    '',
    ...args,
  )
}
