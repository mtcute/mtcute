import { _defaultLoggingHandler } from './platform/logging'

let defaultLogLevel = 2

if (typeof process !== 'undefined') {
    const envLogLevel = parseInt(process.env.MTCUTE_LOG_LEVEL ?? '')

    if (!isNaN(envLogLevel)) {
        defaultLogLevel = envLogLevel
    }
} else if (typeof localStorage !== 'undefined') {
    const localLogLevel = parseInt(localStorage.MTCUTE_LOG_LEVEL)

    if (!isNaN(localLogLevel)) {
        defaultLogLevel = localLogLevel
    }
}

const FORMATTER_RE = /%[a-zA-Z]/g

/**
 * Logger created by {@link LogManager}
 */
export class Logger {
    private color: number

    prefix = ''

    constructor(
        readonly mgr: LogManager,
        readonly tag: string,
        readonly parent: Logger = mgr,
    ) {
        let hash = 0

        for (let i = 0; i < tag.length; i++) {
            hash = (hash << 5) - hash + tag.charCodeAt(i)
            hash |= 0 // convert to 32bit int
        }

        this.color = Math.abs(hash) % 6
    }

    getPrefix(): string {
        let s = ''

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let obj: Logger | undefined = this

        while (obj) {
            if (obj.prefix) s = obj.prefix + s
            obj = obj.parent
        }

        return s
    }

    log(level: number, fmt: string, ...args: unknown[]): void {
        if (level > this.mgr.level) return
        // eslint-disable-next-line dot-notation
        if (!this.mgr['_filter'](this.tag)) return

        // custom formatters
        if (
            fmt.indexOf('%h') > -1 ||
            fmt.indexOf('%b') > -1 ||
            fmt.indexOf('%j') > -1 ||
            fmt.indexOf('%l') > -1
        ) {
            let idx = 0
            fmt = fmt.replace(FORMATTER_RE, (m) => {
                if (m === '%h' || m === '%b' || m === '%j' || m === '%l') {
                    const val = args[idx]

                    args.splice(idx, 1)

                    if (m === '%h') {
                        if (Buffer.isBuffer(val)) return val.toString('hex')
                        if (typeof val === 'number') return val.toString(16)

                        return String(val)
                    }
                    if (m === '%b') return String(Boolean(val))

                    if (m === '%j') {
                        return JSON.stringify(val, (k, v) => {
                            if (typeof v === 'object' && v.type === 'Buffer' && Array.isArray(v.data)) {
                                let str = Buffer.from(v.data).toString('base64')
                                if (str.length > 300) str = str.slice(0, 300) + '...'

                                return str
                            }

                            return v
                        })
                    }
                    if (m === '%l') return String(val)
                }

                idx++

                return m
            })
        }

        this.mgr.handler(
            this.color,
            level,
            this.tag,
            this.getPrefix() + fmt,
            args,
        )
    }

    readonly error = this.log.bind(this, LogManager.ERROR)
    readonly warn = this.log.bind(this, LogManager.WARN)
    readonly info = this.log.bind(this, LogManager.INFO)
    readonly debug = this.log.bind(this, LogManager.DEBUG)
    readonly verbose = this.log.bind(this, LogManager.VERBOSE)

    /**
     * Create a {@link Logger} with the given tag
     * from the same {@link LogManager} as the current
     * Logger.
     *
     * @param tag  Logger tag
     */
    create(tag: string): Logger {
        return new Logger(this.mgr, tag, this)
    }
}

const defaultFilter = () => true

/**
 * Log manager. A logger that allows managing child loggers
 */
export class LogManager extends Logger {
    static OFF = 0
    static ERROR = 1
    static WARN = 2
    static INFO = 3
    static DEBUG = 4
    static VERBOSE = 5

    constructor() {
        // workaround because we cant pass this to super
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        super(null as any, 'base')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(this as any).mgr = this
    }

    private _filter: (tag: string) => boolean = defaultFilter

    level = defaultLogLevel
    handler = _defaultLoggingHandler

    disable(): void {
        this.level = 0
    }

    /**
     * Create a {@link Logger} with the given tag
     *
     * @param tag  Logger tag
     */
    create(tag: string): Logger {
        return new Logger(this, tag)
    }

    /**
     * Filter logging by tags.
     *
     * @param cb
     */
    filter(cb: ((tag: string) => boolean) | null): void {
        this._filter = cb ?? defaultFilter
    }
}
