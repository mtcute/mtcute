import type { ConnectionState, RpcCallOptions } from '@mtcute/core'

import { Emitter } from '@fuman/utils'

const testPlatform = {
  beforeExit: () => () => {},
  log: () => {},
  getDefaultLogLevel: () => 0,
  getDeviceModel: () => 'test',
}

export function createTestWorkerClient(params?: {
  call?: (message: unknown, options?: RpcCallOptions) => Promise<unknown>
}): any {
  const stopController = new AbortController()

  return {
    stopSignal: stopController.signal,
    log: { mgr: { handler: () => {} } },
    platform: testPlatform,
    onError: new Emitter<Error>(),
    onConnectionState: new Emitter<ConnectionState>(),
    onServerUpdate: new Emitter<any>(),
    onRawUpdate: new Emitter<any>(),
    updates: undefined,
    storage: {
      self: {
        fetch: async () => null,
        store: async () => {},
        storeFrom: async (value: unknown) => value,
        update: async () => {},
        getCached: () => null,
      },
      peers: {},
      close: async () => {},
      clear: async () => {},
    },
    timers: {
      upsert: async () => {},
      upsertOwned: () => {},
      cancel: async () => {},
      exists: async () => false,
      clearOwner: () => {},
      destroy: () => {},
    },
    appConfig: {
      get: async () => ({}),
      getField: async () => undefined,
    },
    prepare: async () => {},
    connect: async () => {},
    disconnect: async () => {},
    destroy: async () => {
      stopController.abort()
    },
    notifyLoggedIn: async () => {},
    notifyLoggedOut: async () => {},
    notifyChannelOpened: async () => false,
    notifyChannelClosed: async () => false,
    importSession: async () => {},
    exportSession: async () => '',
    handleClientUpdate: async () => {},
    getApiCredentials: async () => ({ id: 0, hash: '' }),
    getPoolSize: async () => 1,
    getPrimaryDcId: async () => 2,
    changePrimaryDc: async () => {},
    computeSrpParams: async () => ({ _: 'inputCheckPasswordEmpty' }),
    computeNewPasswordHash: async () => new Uint8Array(),
    startUpdatesLoop: async () => {},
    stopUpdatesLoop: async () => {},
    getMtprotoMessageId: async () => 0 as any,
    recreateDc: async () => {},
    call: params?.call ?? (async (message: unknown, options?: RpcCallOptions) => ({ message, options })),
  }
}
