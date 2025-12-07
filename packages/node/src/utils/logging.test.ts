import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('logging', () => {
  let consoleLog: typeof console.log

  beforeEach(() => {
    consoleLog = console.log
    console.log = vi.fn()
    vi.resetModules()
  })

  afterEach(() => {
    console.log = consoleLog
  })

  it('should format log messages with TTY colors', async () => {
    const originalIsTTY = process.stdout.isTTY
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true })

    vi.resetModules()
    const { defaultLoggingHandler } = await import('./logging.js')

    defaultLoggingHandler(0, 2, 'test', 'message %s', ['arg'])

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[%s] [%s%s\x1B[0m]'),
      expect.any(String),
      expect.stringContaining('WRN'),
      expect.stringContaining('\x1B['),
      'test',
      'arg',
    )

    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true })
  })

  it('should format log messages without TTY colors', async () => {
    const originalIsTTY = process.stdout.isTTY
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true })

    vi.resetModules()
    const { defaultLoggingHandler } = await import('./logging.js')

    defaultLoggingHandler(0, 3, 'test', 'message %s', ['arg'])

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[%s] [%s]'),
      expect.any(String),
      'INF',
      'test',
      'arg',
    )

    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true })
  })

  it('should handle different log levels', async () => {
    const { defaultLoggingHandler } = await import('./logging.js')

    defaultLoggingHandler(0, 1, 'test', 'error', [])
    defaultLoggingHandler(0, 2, 'test', 'warning', [])
    defaultLoggingHandler(0, 3, 'test', 'info', [])
    defaultLoggingHandler(0, 4, 'test', 'debug', [])
    defaultLoggingHandler(0, 5, 'test', 'verbose', [])

    expect(console.log).toHaveBeenCalledTimes(5)
  })

  it('should handle multiple arguments', async () => {
    const { defaultLoggingHandler } = await import('./logging.js')

    defaultLoggingHandler(0, 3, 'test', 'msg %s %d', ['str', 42])

    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      'test',
      'str',
      42,
    )
  })

  it('should use different colors for tags', async () => {
    const originalIsTTY = process.stdout.isTTY
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true })

    vi.resetModules()
    const { defaultLoggingHandler } = await import('./logging.js')

    for (let color = 0; color < 6; color++) {
      defaultLoggingHandler(color, 3, 'test', 'msg', [])
    }

    expect(console.log).toHaveBeenCalledTimes(6)

    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true })
  })
})
