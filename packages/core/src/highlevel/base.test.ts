import { StubTelegramClient } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

describe('BaseTelegramClient', () => {
    describe('string sessions', () => {
        it('should export session', async () => {
            const client = new StubTelegramClient()
            const session = await client.exportSession()

            expect(session).toMatchInlineSnapshot(
                '"AwQAAAAXAgIADjE0OS4xNTQuMTY3LjUwALsBAAAXAgICDzE0OS4xNTQuMTY3LjIyMrsBAAD-AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
            )
        })
    })
})
