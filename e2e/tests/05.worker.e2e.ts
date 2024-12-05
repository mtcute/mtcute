import type { Message } from 'mtcute'

import type { Worker as NodeWorker } from 'node:worker_threads'
import type { CustomMethods } from './_worker.js'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { after, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { asNonNull } from '@fuman/utils'
import { expect } from 'chai'
import { build } from 'esbuild'
import { Long, TelegramClient, TelegramWorkerPort, tl } from 'mtcute'
import { getApiParams, IS_BUN, IS_DENO, IS_NODE, RUNTIME_DIR, waitFor } from './_utils.js'

const workerFile = new URL('./_worker.ts', import.meta.url)
let worker: Worker | NodeWorker
if (IS_NODE) {
    // because of https://github.com/privatenumber/tsx/issues/354 we can't use tsx directly lol
    const compiled = (await build({
        entryPoints: [fileURLToPath(workerFile)],
        bundle: true,
        format: 'esm',
        write: false,
        target: 'esnext',
        platform: 'node',
        // NB: we have better-sqlite3 in deps to this package because otherwise node fails to resolve it
        external: ['node:*', 'better-sqlite3'],
    })).outputFiles[0].text
    const compiledWorkerFile = join(RUNTIME_DIR, '_worker.js')
    await writeFile(compiledWorkerFile, compiled)

    const { Worker } = await import('node:worker_threads')
    worker = new Worker(compiledWorkerFile)
    worker.on('exit', (code) => {
        console.error('worker exited with code', code)
    })

    worker.on('error', (err) => {
        console.error('worker error', err)
        process.exit(1)
    })
} else if (IS_BUN) {
    const { Worker } = await import('node:worker_threads')
    worker = new Worker(workerFile)
    worker.on('exit', (code) => {
        console.error('worker exited with code', code)
    })

    worker.on('error', (err) => {
        console.error('worker error', err)
        process.exit(1)
    })
} else if (IS_DENO) {
    worker = new Worker(workerFile, { type: 'module' })
}

describe('5. worker', () => {
    const port = new TelegramWorkerPort<CustomMethods>({
        worker,
    })
    const portClient = new TelegramClient({ client: port })

    it('should make api calls', async () => {
        const res = await port.call({ _: 'help.getConfig' })
        expect(res._).to.equal('config')

        const premiumPromo = await port.call({ _: 'help.getPremiumPromo' })
        // ensure Long-s are correctly serialized
        expect(Long.isLong((premiumPromo.users[0] as tl.RawUser).accessHash)).to.equal(true)
    })

    it('should call custom methods', async () => {
        const hello = await port.invokeCustom('hello')
        expect(hello).to.equal('world')

        const sum = await port.invokeCustom('sum', 2, 3)
        expect(sum).to.equal(5)
    })

    it('should throw errors', async () => {
        try {
            await port.call({ _: 'test.useConfigSimple' })
            throw new Error('should have thrown')
        } catch (e) {
            expect(e).to.be.an.instanceOf(tl.RpcError)
        }
    })

    it('should receive updates', async () => {
        const client2 = new TelegramClient(getApiParams('dc2.session'))

        try {
            await client2.connect()
            await port.startUpdatesLoop()

            const me = await portClient.getMe()
            // ensure Long-s are correctly serialized
            expect(Long.isLong(me.raw.accessHash)).equals(true)

            const username = asNonNull(me.username)

            const msgs: Message[] = []
            portClient.onNewMessage.add((msg) => {
                msgs.push(msg)
            })

            const testText = `mtcute worker test ${Math.random()}`
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

    after(async () => {
        await port.close()
        void worker.terminate()
    })
})
