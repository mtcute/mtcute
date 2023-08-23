const BASE_FORMAT = '%s [%с%s%с] [%c%s%c] '
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
    '#ff0000',
    '#ffff00',
    '#0000ff',
    '#00ffff',
    '#ff00ff',
]
const TAG_COLORS = [
    '#44ffff',
    '#44ff44',
    '#ffff44',
    '#4444ff',
    '#ff44ff',
    '#ff4444',
]

/** @internal */
export const _defaultLoggingHandler = (
    color: number,
    level: number,
    tag: string,
    fmt: string,
    args: unknown[],
): void => {
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
