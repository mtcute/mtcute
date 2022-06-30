import { describe, it } from 'mocha'
import { expect } from 'chai'
import { EventEmitter } from 'events'
import { randomBytes } from 'crypto'

import {
    BaseTelegramClient,
    defaultDcs,
    ITelegramTransport,
    tl,
    TransportState,
    NodeCryptoProvider,
    sleep,
} from '../../src'

require('dotenv-flow').config()

class RandomBytesTransport extends EventEmitter implements ITelegramTransport {
    dc!: tl.RawDcOption
    interval!: NodeJS.Timeout | null

    close(): void {
        clearInterval(this.interval!)
        this.emit('close')
        this.interval = null
    }

    connect(dc: tl.RawDcOption): void {
        this.dc = dc

        setTimeout(() => this.emit('ready'), 0)

        this.interval = setInterval(() => {
            this.emit('message', randomBytes(64))
        }, 100)
    }

    currentDc(): tl.RawDcOption | null {
        return this.dc
    }

    send(data: Buffer): Promise<void> {
        return Promise.resolve()
    }

    state(): TransportState {
        return this.interval ? TransportState.Ready : TransportState.Idle
    }
}

describe('fuzz : transport', function () {
    this.timeout(30000)

    it('RandomBytesTransport (no auth)', async () => {
        const client = new BaseTelegramClient({
            crypto: () => new NodeCryptoProvider(),
            transport: () => new RandomBytesTransport(),
            apiId: 0,
            apiHash: '',
            primaryDc: defaultDcs.defaultTestDc,
        })
        client.log.level = 0

        const errors: Error[] = []

        client.onError((err) => {
            errors.push(err)
        })

        await client.connect()
        await sleep(15000)
        await client.close()

        expect(errors.length).gt(0)
        errors.forEach((err) => {
            expect(err.message).match(/unknown object id/i)
        })
    })

    it('RandomBytesTransport (with auth)', async () => {
        const client = new BaseTelegramClient({
            crypto: () => new NodeCryptoProvider(),
            transport: () => new RandomBytesTransport(),
            apiId: 0,
            apiHash: '',
            primaryDc: defaultDcs.defaultTestDc,
        })
        client.log.level = 0

        // random key just to make it think it already has one
        await client.storage.setAuthKeyFor(2, randomBytes(256))

        // in this case, there will be no actual errors, only
        // warnings like 'received message with unknown authKey'
        //
        // to test for that, we hook into `decryptMessage` and make
        // sure that it returns `null`

        await client.connect()

        let hadNonNull = false

        const decryptMessage =
            client.primaryConnection['_session'].decryptMessage

        // ехал any через any
        // видит any - any, any
        // сунул any any в any
        // any any any any
        ;(client.primaryConnection['_session'] as any).decryptMessage = (
            buf: any,
            cb: any
        ) =>
            decryptMessage.call(this, buf, (...args: any[]) => {
                cb(...(args as any))
                hadNonNull = true
            })

        await sleep(15000)
        await client.close()

        expect(hadNonNull).false
    })
})
