import { TcpTransport } from '../../network'

/** @internal */
export const _defaultTransportFactory = () => new TcpTransport()
