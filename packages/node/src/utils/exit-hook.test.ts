import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('exit-hook', () => {
  let processOn: typeof process.on
  let processOff: typeof process.off
  let processKill: typeof process.kill
  let callbacks: Map<string, Function>

  beforeEach(async () => {
    callbacks = new Map()
    processOn = process.on
    processOff = process.off
    processKill = process.kill

    process.on = vi.fn((event: string, handler: Function) => {
      callbacks.set(event, handler)
      return process
    }) as any

    process.off = vi.fn((event: string) => {
      callbacks.delete(event)
      return process
    }) as any

    process.kill = vi.fn()

    vi.resetModules()
  })

  afterEach(() => {
    process.on = processOn
    process.off = processOff
    process.kill = processKill
    vi.restoreAllMocks()
  })

  it('should register exit handlers on first call', async () => {
    const { beforeExit } = await import('./exit-hook.js')

    const fn = vi.fn()
    beforeExit(fn)

    expect(process.on).toHaveBeenCalledWith('beforeExit', expect.any(Function))
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function))
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
    expect(process.on).toHaveBeenCalledWith('exit', expect.any(Function))
  })

  it('should execute callback on SIGINT', async () => {
    const { beforeExit } = await import('./exit-hook.js')

    const fn = vi.fn()
    beforeExit(fn)

    const handler = callbacks.get('SIGINT')
    expect(handler).toBeDefined()
    handler!()

    expect(fn).toHaveBeenCalledOnce()
    expect(process.kill).toHaveBeenCalledWith(process.pid, 2)
  })

  it('should execute callback on SIGTERM', async () => {
    const { beforeExit } = await import('./exit-hook.js')

    const fn = vi.fn()
    beforeExit(fn)

    const handler = callbacks.get('SIGTERM')
    expect(handler).toBeDefined()
    handler!()

    expect(fn).toHaveBeenCalledOnce()
    expect(process.kill).toHaveBeenCalledWith(process.pid, 15)
  })

  it('should execute callback on exit without re-killing', async () => {
    const { beforeExit } = await import('./exit-hook.js')

    const fn = vi.fn()
    beforeExit(fn)

    const handler = callbacks.get('exit')
    expect(handler).toBeDefined()
    handler!()

    expect(fn).toHaveBeenCalledOnce()
    expect(process.kill).not.toHaveBeenCalled()
  })

  it('should execute multiple callbacks', async () => {
    const { beforeExit } = await import('./exit-hook.js')

    const fn1 = vi.fn()
    const fn2 = vi.fn()
    beforeExit(fn1)
    beforeExit(fn2)

    const handler = callbacks.get('SIGINT')
    handler!()

    expect(fn1).toHaveBeenCalledOnce()
    expect(fn2).toHaveBeenCalledOnce()
  })

  it('should allow removing callbacks', async () => {
    const { beforeExit } = await import('./exit-hook.js')

    const fn = vi.fn()
    const remove = beforeExit(fn)
    remove()

    const handler = callbacks.get('SIGINT')
    handler!()

    expect(fn).not.toHaveBeenCalled()
  })

  it('should only handle exit once', async () => {
    const { beforeExit } = await import('./exit-hook.js')

    const fn = vi.fn()
    beforeExit(fn)

    const handler = callbacks.get('SIGINT')
    handler!()
    handler!()

    expect(fn).toHaveBeenCalledOnce()
  })

  it('should unregister all handlers after exit', async () => {
    const { beforeExit } = await import('./exit-hook.js')

    const fn = vi.fn()
    beforeExit(fn)

    const handler = callbacks.get('SIGINT')
    handler!()

    expect(process.off).toHaveBeenCalledWith('beforeExit', expect.any(Function))
    expect(process.off).toHaveBeenCalledWith('SIGINT', expect.any(Function))
    expect(process.off).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
    expect(process.off).toHaveBeenCalledWith('exit', expect.any(Function))
  })
})
