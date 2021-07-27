import { describe, it } from 'mocha'
import { expect } from 'chai'
import { TransportState } from '../../src'
import { sleep } from '../../src/utils/misc-utils'
import { createTestTelegramClient } from './utils'

require('dotenv-flow').config()

describe('e2e : idle connection', function () {

    this.timeout(120000)

    // 75s is to make sure ping is sent

    it('75s idle to test dc', async () => {
        const client = createTestTelegramClient()

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
        const client = createTestTelegramClient()

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
