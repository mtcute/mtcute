const isTty = typeof process === 'object' && Boolean(process.stdout?.isTTY)

const BASE_FORMAT = isTty ? '%s [%s] [%s%s\x1B[0m] ' : '%s [%s] [%s] '
const LEVEL_NAMES = isTty
    ? [
        '', // OFF
        '\x1B[31mERR\x1B[0m',
        '\x1B[33mWRN\x1B[0m',
        '\x1B[34mINF\x1B[0m',
        '\x1B[36mDBG\x1B[0m',
        '\x1B[35mVRB\x1B[0m',
    ]
    : [
        '', // OFF
        'ERR',
        'WRN',
        'INF',
        'DBG',
        'VRB',
    ]
const TAG_COLORS = [6, 2, 3, 4, 5, 1].map(i => `\x1B[3${i};1m`)

/** @internal */
export const defaultLoggingHandler: (
    color: number,
    level: number,
    tag: string,
    fmt: string,
    args: unknown[]
) => void = isTty
    ? (color: number, level: number, tag: string, fmt: string, args: unknown[]): void => {
        // eslint-disable-next-line no-console
        console.log(BASE_FORMAT + fmt, new Date().toISOString(), LEVEL_NAMES[level], TAG_COLORS[color], tag, ...args)
    }
    : (color: number, level: number, tag: string, fmt: string, args: unknown[]): void => {
        // eslint-disable-next-line no-console
        console.log(BASE_FORMAT + fmt, new Date().toISOString(), LEVEL_NAMES[level], tag, ...args)
    }
