import { TcpTransport } from '../../network/transports/tcp.js'

/** @internal */
export const _defaultTransportFactory = () => new TcpTransport()
