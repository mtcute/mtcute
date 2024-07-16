/* eslint-disable no-restricted-imports */
import { expect } from 'chai'
import { describe, it } from 'mocha'
import path from 'path'
import { Worker } from 'worker_threads'

import { TelegramClient } from '@mtcute/core/client.js'
import { Long, Message, TelegramWorkerPort, tl } from '@mtcute/node'

import { getApiParams, waitFor } from '../utils.js'
import type { CustomMethods } from './_worker.js'

describe('5. worker', async function () {
    this.timeout(300_000)

    const worker = new Worker(path.resolve(__dirname, '_worker.js'))

    const port = new TelegramWorkerPort<CustomMethods>({
        worker,
    })
    const portClient = new TelegramClient({ client: port })

    it('should make api calls', async function () {
        const res = await port.call({ _: 'help.getConfig' })
        expect(res._).to.equal('config')

        const premiumPromo = await port.call({ _: 'help.getPremiumPromo' })
        // ensure Long-s are correctly serialized
        expect(Long.isLong((premiumPromo.users[0] as tl.RawUser).accessHash)).to.equal(true)
    })

    it('should call custom methods', async function () {
        const hello = await port.invokeCustom('hello')
        expect(hello).to.equal('world')

        const sum = await port.invokeCustom('sum', 2, 3)
        expect(sum).to.equal(5)
    })

    it('should throw errors', async function () {
        try {
            await port.call({ _: 'test.useConfigSimple' })
            throw new Error('should have thrown')
        } catch (e) {
            expect(e).to.be.an.instanceOf(tl.RpcError)
        }
    })

    it('should receive updates', async function () {
        const client2 = new TelegramClient(getApiParams('dc2.session'))

        try {
            await client2.connect()
            await port.startUpdatesLoop()

            const me = await portClient.getMe()
            // ensure Long-s are correctly serialized
            expect(Long.isLong(me.raw.accessHash)).equals(true)

            let username = me.username

            if (!username) {
                username = `mtcute_e2e_${Math.random().toString(36).slice(2, 8)}`
                await portClient.setMyUsername(username)
            }

            const msgs: Message[] = []
            portClient.on('new_message', (msg) => {
                msgs.push(msg)
            })

            const testText = `test ${Math.random()}`
            await client2.sendText(username, testText)

            await waitFor(() => {
                expect(msgs.length).to.be.greaterThan(0)
                expect(msgs[0].text).to.equal(testText)
            })
        } catch (e) {
            await client2.close()
            throw e
        }

        await client2.close()
    })

    this.afterAll(async () => {
        await port.close()
        worker.terminate()
    })
})
