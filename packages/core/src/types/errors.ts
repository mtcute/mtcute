/**
 * Base class for all mtcute errors
 */
export class MtcuteError extends Error {}

/**
 * Method invocation was invalid because some argument
 * passed was invalid.
 */
export class MtArgumentError extends MtcuteError {}

/**
 * Something isn't right with security of the connection.
 */
export class MtSecurityError extends MtcuteError {}

/**
 * Either you requested or the server returned something
 * that is not (yet) supported.
 *
 * Stay tuned for future updates!
 *
 * In some cases, this error may mean that you are missing some
 * optional peer dependencies, or that the feature is not supported
 * in the current environment.
 */
export class MtUnsupportedError extends MtcuteError {}

/**
 * Server returned something of an unexpected type.
 *
 * This is usually a problem on library side.
 * Feel free to open an issue about this!
 */
export class MtTypeAssertionError extends MtcuteError {
  /**
   * Context at which the error occurred.
   * Usually a user-friendly string containing name
   * of the high-level API method, name of the TL
   * RPC method, and path of the entity,
   * like this: `signIn (@ auth.signIn -> user)`
   */
  context: string

  /** Expected TL type */
  expected: string

  /** Actual TL type */
  actual: string

  constructor(context: string, expected: string, actual: string) {
    super(`Type assertion error at ${context}: expected ${expected}, but got ${actual}`)
    this.context = context
    this.expected = expected
    this.actual = actual
  }
}

export class MtTimeoutError extends MtcuteError {
  constructor(readonly timeout?: number) {
    super(`Request timed out${timeout ? ` after ${timeout}ms` : ''}`)
  }
}
