import { TransportFactory } from './abstract.js'

export * from './abstract.js'
export * from './intermediate.js'
export * from './obfuscated.js'
export * from './streamed.js'
export * from './wrapped.js'

import { _defaultTransportFactory } from '../../utils/platform/transport.js'

/** Platform-defined default transport factory */
export const defaultTransportFactory: TransportFactory = _defaultTransportFactory
