import type { Message } from '@mtcute/deno'
import type { CustomMethods } from './_worker.ts'
import { TelegramClient } from '@mtcute/core/client.js'
import { Long, TelegramWorkerPort, tl } from '@mtcute/deno'

import { assertEquals, assertGreater, assertInstanceOf } from 'https://deno.land/std@0.223.0/assert/mod.ts'

import { getApiParams, waitFor } from '../utils.ts'

Deno.test('5. worker', { sanitizeResources: false }, async (t) => {
    const worker = new Worker(new URL('_worker.ts', import.meta.url), {
        type: 'module',
    })

    const port = new TelegramWorkerPort<CustomMethods>({
        worker,
    })
    const portClient = new TelegramClient({ client: port })

    await t.step('should make api calls', async () => {
        const res = await port.call({ _: 'help.getConfig' })
        assertEquals(res._, 'config')

        const premiumPromo = await port.call({ _: 'help.getPremiumPromo' })
        // ensure Long-s are correctly serialized
        assertEquals(Long.isLong((premiumPromo.users[0] as tl.RawUser).accessHash), true)
    })

    await t.step('should call custom methods', async () => {
        const hello = await port.invokeCustom('hello')
        assertEquals(hello, 'world')

        const sum = await port.invokeCustom('sum', 2, 3)
        assertEquals(sum, 5)
    })

    await t.step('should throw errors', async () => {
        try {
            await port.call({ _: 'test.useConfigSimple' })
            throw new Error('should have thrown')
        } catch (e) {
            assertInstanceOf(e, tl.RpcError)
        }
    })

    await t.step('should receive updates', async () => {
        const client2 = new TelegramClient(getApiParams('dc2.session'))

        try {
            await client2.connect()
            await port.startUpdatesLoop()

            const me = await portClient.getMe()
            // ensure Long-s are correctly serialized
            assertEquals(Long.isLong(me.raw.accessHash), true)
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
                assertGreater(msgs.length, 0)
                assertEquals(msgs[0].text, testText)
            })
        } catch (e) {
            await client2.close()
            throw e
        }

        await client2.close()
    })

    await port.close()
    worker.terminate()
})
