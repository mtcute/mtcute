import { WebSocketTransport } from '../../network/transports/websocket.js'
import { MtUnsupportedError } from '../../types/index.js'

/** @internal */
export const _defaultTransportFactory =
    // if no websocket, throw an error i guess ¯\_(ツ)_/¯
    // (user can still implement something on their own)
    typeof WebSocket === 'undefined' ?
        () => {
            throw new MtUnsupportedError(
                'Neither TCP nor WebSocket are available. Please pass a Transport factory explicitly',
            )
        } :
        () => new WebSocketTransport()
