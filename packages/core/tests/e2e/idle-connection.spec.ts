import { describe, it } from 'mocha'
import { expect } from 'chai'
import { BaseTelegramClient, defaultDcs, TransportState } from '../../src'
import { sleep } from '../../src/utils/misc-utils'

require('dotenv-flow').config()

describe('e2e : idle connection', function () {
    if (!process.env.API_ID || !process.env.API_HASH) {
        console.warn('Warning: skipping e2e idle connection test (no API_ID or API_HASH)')
        return
    }

    this.timeout(120000)

    // 75s is to make sure ping is sent

    it('75s idle to test dc', async () => {
        const client = new BaseTelegramClient({
            apiId: process.env.API_ID!,
            apiHash: process.env.API_HASH!,
            primaryDc: defaultDcs.defaultTestDc
        })

        await client.connect()
        await sleep(75000)

        expect(client.primaryConnection['_transport'].state()).eq(TransportState.Ready)

        const config = await client.call({ _: 'help.getConfig' })
        expect(config._).eql('config')

        await client.close()
        expect(client.primaryConnection['_transport'].state()).eq(TransportState.Idle)
    })

    if (!process.env.USER_SESSION) {
        console.warn('Warning: skipping e2e idle connection test with auth (no USER_SESSION)')
        return
    }

    it('75s idle to test dc with auth', async () => {
        const client = new BaseTelegramClient({
            apiId: process.env.API_ID!,
            apiHash: process.env.API_HASH!,
            primaryDc: defaultDcs.defaultTestDc
        })

        client.importSession(process.env.USER_SESSION!)

        await client.connect()
        await sleep(75000)

        expect(client.primaryConnection['_transport'].state()).eq(TransportState.Ready)

        const config = await client.call({ _: 'help.getConfig' })
        expect(config._).eql('config')

        await client.close()
        expect(client.primaryConnection['_transport'].state()).eq(TransportState.Idle)
    })
})
