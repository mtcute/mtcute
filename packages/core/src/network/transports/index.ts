import { TransportFactory } from './abstract'

export * from './abstract'
export * from './streamed'
export * from './wrapped'
export * from './tcp'
export * from './websocket'
export * from './intermediate'
export * from './obfuscated'

/** Platform-defined default transport factory */
export let defaultTransportFactory: TransportFactory
if (typeof process !== 'undefined') {
    // we are in node, use tcp transport by default
    const { TcpIntermediateTransport } = require('./tcp')
    defaultTransportFactory = () => new TcpIntermediateTransport()
} else {
    // we are in browser (probably), use websocket
    // if no websocket, throw an error i guess ¯\_(ツ)_/¯
    // (user can still implement something on their own)
    if (typeof WebSocket === 'undefined') {
        defaultTransportFactory = () => {
            throw new Error(
                'Neither TCP nor WebSocket are available. Please pass a Transport factory explicitly'
            )
        }
    } else {
        const { WebSocketIntermediateTransport } = require('./websocket')
        defaultTransportFactory = () => new WebSocketIntermediateTransport()
    }
}
