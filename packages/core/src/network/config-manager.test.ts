import type { AsyncResourceContext } from '@fuman/utils'
import type { tl } from '../tl/index.js'
import { createStub } from '@mtcute/test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConfigManager } from './config-manager.js'

describe('ConfigManager', () => {
  const config = createStub('config', {
    expires: 300,
  })
  const getConfig = vi.fn()
  const fakePerfNow = vi.fn(() => Date.now())

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    vi.stubGlobal('performance', {
      now: fakePerfNow,
    })
    getConfig.mockClear().mockImplementation(() => Promise.resolve(config))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('should fetch initial config', async () => {
    const cm = new ConfigManager(getConfig)

    const fetchedConfig = await cm.get()

    expect(getConfig).toHaveBeenCalledTimes(1)
    expect(fetchedConfig).toEqual(config)
    expect(cm.getCached()).toEqual(config)
  })

  it('should automatically update config', async () => {
    const cm = new ConfigManager(getConfig)
    await cm.update()

    getConfig.mockImplementation(() =>
      Promise.resolve({
        ...config,
        expires: 600,
      }),
    )

    await vi.advanceTimersByTimeAsync(301_000)

    expect(getConfig).toHaveBeenCalledTimes(2)
  })

  it('should correctly determine stale config', () => {
    const cm = new ConfigManager(getConfig)
    expect(cm.isStale).toBe(true)

    cm.setData(config, config.expires * 1000)
    expect(cm.isStale).toBe(false)

    vi.setSystemTime(300_000)
    expect(cm.isStale).toBe(true)
  })

  it('should not update config if not stale', async () => {
    const cm = new ConfigManager(getConfig)
    await cm.update()

    getConfig.mockClear()
    await cm.update()

    expect(getConfig).not.toHaveBeenCalled()
  })

  it('should not update config twice', async () => {
    const cm = new ConfigManager(getConfig)
    await cm.update()

    getConfig.mockImplementation(() =>
      Promise.resolve({
        ...config,
        expires: 600,
      }),
    )
    getConfig.mockClear()
    await vi.advanceTimersByTimeAsync(301_000)
    await Promise.all([cm.update(), cm.update()])

    expect(getConfig).toHaveBeenCalledOnce()
  })

  it('should call listeners on config update', async () => {
    const cm = new ConfigManager(getConfig)
    const listener = vi.fn()
    cm.onUpdated.add(listener)

    await cm.update()
    const call = listener.mock.calls[0][0] as AsyncResourceContext<tl.RawConfig>
    const callCopy = structuredClone({
      current: call.current,
      currentFetchedAt: call.currentFetchedAt,
      currentExpiresAt: call.currentExpiresAt,
      isBackground: call.isBackground,
    })

    vi.setSystemTime(300_000)
    cm.onUpdated.remove(listener)
    await cm.update()

    expect(listener).toHaveBeenCalledOnce()
    expect(callCopy).toEqual({
      current: config,
      currentExpiresAt: 300_000,
      currentFetchedAt: 0,
      isBackground: false,
    })
  })

  it('should correctly destroy', async () => {
    const cm = new ConfigManager(getConfig)
    await cm.update()

    cm.destroy()

    getConfig.mockClear()
    await vi.advanceTimersByTimeAsync(301_000)

    expect(getConfig).not.toHaveBeenCalled()
  })

  describe('findOption', () => {
    const useDcOptions = (options: tl.RawDcOption[]) => {
      getConfig.mockImplementation(() =>
        Promise.resolve({
          ...config,
          dcOptions: options,
        }),
      )
    }

    const findOption = async (params: Parameters<ConfigManager['findOption']>[0]) => {
      const cm = new ConfigManager(getConfig)
      await cm.update()

      return cm.findOption(params)
    }

    it('should find option by dc id', async () => {
      useDcOptions([
        createStub('dcOption', { id: 1, ipAddress: '1.1.1.1' }),
        createStub('dcOption', { id: 2, ipAddress: '2.2.2.2' }),
      ])

      expect(await findOption({ dcId: 1 })).toMatchObject({
        id: 1,
        ipAddress: '1.1.1.1',
      })
      expect(await findOption({ dcId: 2 })).toMatchObject({
        id: 2,
        ipAddress: '2.2.2.2',
      })
    })

    it('should ignore tcpoOnly options', async () => {
      useDcOptions([
        createStub('dcOption', { id: 1, ipAddress: '1.1.1.1', tcpoOnly: true }),
        createStub('dcOption', { id: 1, ipAddress: '1.1.1.2' }),
      ])

      expect(await findOption({ dcId: 1 })).toMatchObject({
        id: 1,
        ipAddress: '1.1.1.2',
      })
    })

    it('should respect allowMedia flag', async () => {
      useDcOptions([
        createStub('dcOption', { id: 2, ipAddress: '2.2.2.2', mediaOnly: true }),
        createStub('dcOption', { id: 2, ipAddress: '2.2.2.3' }),
      ])

      expect(await findOption({ dcId: 2 })).toMatchObject({
        id: 2,
        ipAddress: '2.2.2.3',
      })

      expect(await findOption({ dcId: 2, allowMedia: true })).toMatchObject({
        id: 2,
        ipAddress: '2.2.2.2',
      })
    })

    it('should respect preferMedia flag', async () => {
      useDcOptions([
        createStub('dcOption', { id: 2, ipAddress: '2.2.2.3' }),
        createStub('dcOption', { id: 2, ipAddress: '2.2.2.2', mediaOnly: true }),
      ])

      expect(await findOption({ dcId: 2 })).toMatchObject({
        id: 2,
        ipAddress: '2.2.2.3',
      })

      expect(await findOption({ dcId: 2, allowMedia: true, preferMedia: true })).toMatchObject({
        id: 2,
        ipAddress: '2.2.2.2',
      })
    })

    it('should respect allowIpv6 flag', async () => {
      useDcOptions([
        createStub('dcOption', { id: 2, ipAddress: '::1', ipv6: true }),
        createStub('dcOption', { id: 2, ipAddress: '2.2.2.3' }),
      ])

      expect(await findOption({ dcId: 2 })).toMatchObject({
        id: 2,
        ipAddress: '2.2.2.3',
      })

      expect(await findOption({ dcId: 2, allowIpv6: true })).toMatchObject({
        id: 2,
        ipAddress: '::1',
      })
    })

    it('should respect preferIpv6 flag', async () => {
      useDcOptions([
        createStub('dcOption', { id: 2, ipAddress: '2.2.2.3' }),
        createStub('dcOption', { id: 2, ipAddress: '::1', ipv6: true }),
      ])

      expect(await findOption({ dcId: 2 })).toMatchObject({
        id: 2,
        ipAddress: '2.2.2.3',
      })

      expect(await findOption({ dcId: 2, allowIpv6: true, preferIpv6: true })).toMatchObject({
        id: 2,
        ipAddress: '::1',
      })
    })
  })

  describe('findOptions', () => {
    const findOptions = async (
      options: tl.RawDcOption[],
      params: Parameters<ConfigManager['findOptions']>[0],
    ) => {
      getConfig.mockImplementation(() =>
        Promise.resolve({
          ...config,
          dcOptions: options,
        }),
      )

      const cm = new ConfigManager(getConfig)
      await cm.update()

      return (await cm.findOptions(params)).map(it => it.ipAddress)
    }

    it('should return all matching options', async () => {
      expect(await findOptions([
        createStub('dcOption', { id: 5, ipAddress: '5.5.5.1' }),
        createStub('dcOption', { id: 4, ipAddress: '4.4.4.4' }),
        createStub('dcOption', { id: 5, ipAddress: '5.5.5.2', static: true }),
        createStub('dcOption', { id: 5, ipAddress: '::5', ipv6: true }),
      ], { dcId: 5 })).toEqual(['5.5.5.1', '5.5.5.2'])
    })

    it('should order options by preference, keeping the original order otherwise', async () => {
      const options = [
        createStub('dcOption', { id: 2, ipAddress: '2.2.2.1' }),
        createStub('dcOption', { id: 2, ipAddress: '::1', ipv6: true }),
        createStub('dcOption', { id: 2, ipAddress: '2.2.2.2', mediaOnly: true }),
        createStub('dcOption', { id: 2, ipAddress: '2.2.2.3' }),
        createStub('dcOption', { id: 2, ipAddress: '::2', ipv6: true, mediaOnly: true }),
      ]

      expect(await findOptions(options, { dcId: 2, allowMedia: true, preferMedia: true }))
        .toEqual(['2.2.2.2', '2.2.2.1', '2.2.2.3'])
      expect(await findOptions(options, { dcId: 2, allowIpv6: true, preferIpv6: true }))
        .toEqual(['::1', '2.2.2.1', '2.2.2.3'])
      expect(await findOptions(options, {
        dcId: 2,
        allowIpv6: true,
        preferIpv6: true,
        allowMedia: true,
        preferMedia: true,
      })).toEqual(['::2', '2.2.2.2', '::1', '2.2.2.1', '2.2.2.3'])
    })
  })
})
