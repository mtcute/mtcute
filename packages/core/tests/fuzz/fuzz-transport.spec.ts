import { describe, it } from 'mocha'
import { expect } from 'chai'
import {
    BaseTelegramClient,
    defaultDcs,
    ITelegramTransport, NodeCryptoProvider,
    randomBytes,
    tl,
    TransportState,
} from '../../src'
import { EventEmitter } from 'events'
import { sleep } from '../../src/utils/misc-utils'

require('dotenv-flow').config()

class RandomBytesTransport extends EventEmitter implements ITelegramTransport {
    dc: tl.RawDcOption

    interval: NodeJS.Timeout | null

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
            client.primaryConnection['_mtproto'].decryptMessage
        client.primaryConnection[
            '_mtproto'
        ].decryptMessage = async function () {
            const res = await decryptMessage.apply(this, arguments)
            if (res !== null) hadNonNull = true

            return res
        }

        await sleep(15000)
        await client.close()

        expect(hadNonNull).false
    })
})
