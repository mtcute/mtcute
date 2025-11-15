export interface CommonDeeplinkOptions {
  /**
   * Protocol to use for deeplink
   * - `tg` - use `tg://` protocol links (default)
   * - `http` - use `http://` protocol
   * - `https` - use `https://` protocol
   * - `none` - don't use any protocol
   *
   * @default  'https'
   */
  protocol?: 'tg' | 'http' | 'https' | 'none'

  /**
   * For protocols except `tg://`, domain to use
   *
   * @default  't.me'
   */
  domain?: string
}

type InputQuery = Record<string, string | number | true | undefined> | null

interface BuildDeeplinkOptions<T> {
  internalBuild?: (options: T) => [string, InputQuery]
  internalParse?: (path: string, query: URLSearchParams) => T | null

  externalBuild?: (options: T) => [string, InputQuery]
  externalParse?: (path: string, query: URLSearchParams) => T | null
}

export interface Deeplink<T> {
  (options: T & CommonDeeplinkOptions): string
  parse: (url: string) => T | null
}

function writeQuery(query: InputQuery) {
  if (!query) return ''

  let str = ''

  for (const [key, value] of Object.entries(query)) {
    // eslint-disable-next-line eqeqeq
    if (value == undefined) continue

    if (str) str += '&'

    if (value === true) {
      str += `${key}`
      continue
    }

    str += `${key}=${encodeURIComponent(value)}`
  }

  if (!str) return ''

  return `?${str}`
}

/* @__NO_SIDE_EFFECTS__ */ export function deeplinkBuilder<T>(params: BuildDeeplinkOptions<T>): Deeplink<T> {
  const { internalBuild, internalParse, externalBuild, externalParse } = params

  const fn_ = (options: T & CommonDeeplinkOptions) => {
    const { protocol = 'https', domain = 't.me', ...rest } = options

    if (protocol === 'tg') {
      if (!internalBuild) throw new Error('tg:// deeplink is not supported')

      const [path, query] = internalBuild(rest as T)

      return `tg://${path}${writeQuery(query)}`
    }

    if (!externalBuild) throw new Error('t.me deeplink is not supported')

    const [path, query] = externalBuild(rest as T)

    return `${protocol}://${domain}/${path}${writeQuery(query)}`
  }

  const fn = fn_ as Deeplink<T>

  fn.parse = (url: string) => {
    const isInternal = url.startsWith('tg://')

    // URL with non-standard protocols has bad behavior across environments
    if (isInternal) url = `https://fake/${url.slice(5)}`

    const parsed = new URL(url)

    if (isInternal) {
      if (!internalParse) throw new Error('tg:// deeplink is not supported')

      const path = parsed.pathname.slice(1)

      return internalParse(path, parsed.searchParams)
    }

    if (!externalParse) throw new Error('t.me deeplink is not supported')

    const path = parsed.pathname.slice(1)

    return externalParse(path, parsed.searchParams)
  }

  return fn
}
