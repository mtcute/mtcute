import type { WebSocketConstructor } from '@fuman/net'
import type {
    IPacketCodec,
    ITelegramConnection,
    TelegramTransport,
} from '@mtcute/core'
import type { BasicDcOption } from './utils.js'
import { connectWs } from '@fuman/net'

import {
    IntermediatePacketCodec,
    MtUnsupportedError,
    ObfuscatedPacketCodec,
} from '@mtcute/core'

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
        ws = ws ?? WebSocket
        baseDomain = baseDomain ?? 'web.telegram.org'
        subdomains = subdomains ?? subdomainsMap

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

    async connect(dc: BasicDcOption): Promise<ITelegramConnection> {
        const url = `wss://${this._subdomains[dc.id]}.${this._baseDomain}/apiws${dc.testMode ? '_test' : ''}`

        return connectWs({
            url,
            implementation: this._WebSocket,
            protocols: 'binary',
        })
    }

    packetCodec(): IPacketCodec {
        return new ObfuscatedPacketCodec(new IntermediatePacketCodec())
    }
}
