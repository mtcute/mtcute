import type {
    IPacketCodec,
    ITelegramConnection,
    TelegramTransport,
} from '@mtcute/core'
import {
    IntermediatePacketCodec,
    MtUnsupportedError,
    ObfuscatedPacketCodec,
} from '@mtcute/core'
import { WebSocketConnection } from '@fuman/net'

import type { BasicDcOption } from './utils'

export interface WebSocketConstructor {
    new (address: string, protocol?: string): WebSocket
}

const subdomainsMap: Record<string, string> = {
    1: 'pluto',
    2: 'venus',
    3: 'aurora',
    4: 'vesta',
    5: 'flora',
}

export class WebSocketTransport implements TelegramTransport {
    private _baseDomain: string
    private _subdomains: Record<string, string>
    private _WebSocket: WebSocketConstructor

    constructor({
        ws = WebSocket,
        baseDomain = 'web.telegram.org',
        subdomains = subdomainsMap,
    }: {
        /** Custom implementation of WebSocket (e.g. https://npm.im/ws) */
        ws?: WebSocketConstructor
        /** Base WebSocket domain */
        baseDomain?: string
        /** Map of sub-domains (key is DC ID, value is string) */
        subdomains?: Record<string, string>
    } = {}) {
        if (!ws) {
            throw new MtUnsupportedError(
                'To use WebSocket transport with NodeJS, install `ws` package and pass it to constructor',
            )
        }

        // gotta love cjs/esm compat
        if ('default' in ws) {
            ws = ws.default as WebSocketConstructor
        }

        this._baseDomain = baseDomain
        this._subdomains = subdomains
        this._WebSocket = ws
    }

    async connect(dc: BasicDcOption, testMode: boolean): Promise<ITelegramConnection> {
        const url = `wss://${this._subdomains[dc.id]}.${this._baseDomain}/apiws${testMode ? '_test' : ''}`

        return new Promise((resolve, reject) => {
            const socket = new this._WebSocket(url)

            const onError = (event: Event) => {
                socket.removeEventListener('error', onError)
                reject(event)
            }
            socket.addEventListener('error', onError)
            socket.addEventListener('open', () => {
                socket.removeEventListener('error', onError)
                resolve(new WebSocketConnection(socket))
            })
        })
    }

    packetCodec(): IPacketCodec {
        return new ObfuscatedPacketCodec(new IntermediatePacketCodec())
    }
}
