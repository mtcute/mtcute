import { expect } from 'chai'
import { describe, it } from 'mocha'

import { BaseTelegramClient } from '@mtcute/core/client.js'

// @fix-import
import { getApiParams } from '../../utils'

describe('@mtcute/core', function () {
    this.timeout(300_000)

    it('connects to test DC and makes help.getNearestDc', async () => {
        const tg = new BaseTelegramClient({
            ...getApiParams(),
        })

        await tg.connect()
        const config = await tg.call({ _: 'help.getNearestDc' })
        await tg.close()

        expect(config).to.be.an('object')
        expect(config._).to.equal('nearestDc')
        expect(config.thisDc).to.equal(2)
    })
})
