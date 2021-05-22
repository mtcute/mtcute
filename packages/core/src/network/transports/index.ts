import { TransportFactory } from './abstract'

export * from './abstract'
export * from './streamed'
export * from './tcp'
export * from './tcp-intermediate'
export * from './websocket'
export * from './ws-obfuscated'

/** Platform-defined default transport factory */
export let defaultTransportFactory: TransportFactory
if (typeof process !== 'undefined') {
    // we are in node, use tcp transport by default
    const { TcpIntermediateTransport } = require('./tcp-intermediate')
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
        const { WebSocketObfuscatedTransport } = require('./ws-obfuscated')
        defaultTransportFactory = () => new WebSocketObfuscatedTransport()
    }
}
