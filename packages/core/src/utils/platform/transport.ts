import { TcpTransport } from '../../network/transports/tcp'

/** @internal */
export const _defaultTransportFactory = () => new TcpTransport()
