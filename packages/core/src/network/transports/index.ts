import { TransportFactory } from './abstract'

export * from './abstract'
export * from './streamed'
export * from './wrapped'
export * from './tcp'
export * from './websocket'
export * from './intermediate'
export * from './obfuscated'

import { _defaultTransportFactory } from '../../utils/platform/transport'

/** Platform-defined default transport factory */
export const defaultTransportFactory: TransportFactory =
    _defaultTransportFactory
