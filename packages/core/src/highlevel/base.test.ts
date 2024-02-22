import { describe, expect, it } from 'vitest'

import { StubTelegramClient } from '@mtcute/test'

describe('BaseTelegramClient', () => {
    describe('string sessions', () => {
        it('should export session', async () => {
            const client = new StubTelegramClient()
            const session = await client.exportSession()

            expect(session).toMatchInlineSnapshot(
                '"AwQAAAAXAQIADjE0OS4xNTQuMTY3LjUwALsBAAAXAQICDzE0OS4xNTQuMTY3LjIyMrsBAAD-AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
            )
        })
    })
})
