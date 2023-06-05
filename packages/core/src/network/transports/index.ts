import { TransportFactory } from './abstract'

export * from './abstract'
export * from './intermediate'
export * from './obfuscated'
export * from './streamed'
export * from './tcp'
export * from './websocket'
export * from './wrapped'

import { _defaultTransportFactory } from '../../utils/platform/transport'

/** Platform-defined default transport factory */
export const defaultTransportFactory: TransportFactory =
    _defaultTransportFactory
