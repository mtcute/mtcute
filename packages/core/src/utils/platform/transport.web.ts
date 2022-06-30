import { WebSocketTransport } from '../../network'

/** @internal */
export const _defaultTransportFactory =
    typeof WebSocket === 'undefined'
        ? // if no websocket, throw an error i guess ¯\_(ツ)_/¯
          // (user can still implement something on their own)
          () => {
              throw new Error(
                  'Neither TCP nor WebSocket are available. Please pass a Transport factory explicitly'
              )
          }
        : () => new WebSocketTransport()
