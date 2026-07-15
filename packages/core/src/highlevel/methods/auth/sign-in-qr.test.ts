import type { tl } from '../../../tl/index.js'
import { Deferred } from '@fuman/utils'
import { StubTelegramClient } from '@mtcute/test'
import { describe, expect, it, vi } from 'vitest'

import { signInQr } from './sign-in-qr.js'

describe('signInQr', () => {
  it('should not change the primary DC if abort wins after export resolves', async () => {
    const client = new StubTelegramClient()
    const abort = new AbortController()
    const exportCalled = new Deferred<void>()
    const exportResponse = new Deferred<tl.auth.RawLoginTokenMigrateTo>()
    const changePrimaryDc = vi.spyOn(client, 'changePrimaryDc').mockResolvedValue()
    const call = vi.spyOn(client, 'call')

    client.respondWith('auth.exportLoginToken', () => {
      exportCalled.resolve()
      return exportResponse.promise
    })

    const reason = new Error('controlled abort')
    const result = signInQr(client, {
      abortSignal: abort.signal,
      onUrlUpdated: () => {},
    })
    const rejection = expect(result).rejects.toBe(reason)

    await exportCalled.promise
    exportResponse.resolve({
      _: 'auth.loginTokenMigrateTo',
      dcId: 2,
      token: new Uint8Array(),
    })
    abort.abort(reason)

    await rejection
    expect(changePrimaryDc).not.toHaveBeenCalled()
    expect(call).toHaveBeenCalledOnce()
  })

  it('should not import the token if aborted during the primary DC change', async () => {
    const client = new StubTelegramClient()
    const abort = new AbortController()
    const changeStarted = new Deferred<void>()
    const changeFinished = new Deferred<void>()
    const call = vi.spyOn(client, 'call')

    client.respondWith('auth.exportLoginToken', () => ({
      _: 'auth.loginTokenMigrateTo',
      dcId: 2,
      token: new Uint8Array(),
    }))
    vi.spyOn(client, 'changePrimaryDc').mockImplementation(() => {
      changeStarted.resolve()
      return changeFinished.promise
    })

    const reason = new Error('controlled abort')
    const result = signInQr(client, {
      abortSignal: abort.signal,
      onUrlUpdated: () => {},
    })
    const rejection = expect(result).rejects.toBe(reason)

    await changeStarted.promise
    abort.abort(reason)
    changeFinished.resolve()

    await rejection
    expect(call).toHaveBeenCalledOnce()
  })
})
