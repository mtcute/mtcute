import { assertEquals } from 'https://deno.land/std@0.223.0/assert/mod.ts'

import { BaseTelegramClient } from '@mtcute/core/client.js'

import { getApiParams } from '../../utils.ts'

Deno.test('@mtcute/core', async (t) => {
    await t.step('connects to test DC and makes help.getNearestDc', async () => {
        const tg = new BaseTelegramClient({
            ...getApiParams(),
        })

        await tg.connect()
        const config = await tg.call({ _: 'help.getNearestDc' })
        await tg.close()

        assertEquals(typeof config, 'object')
        assertEquals(config._, 'nearestDc')
        assertEquals(config.thisDc, 2)
    })
})
