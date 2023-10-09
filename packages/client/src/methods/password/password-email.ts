import { BaseTelegramClient } from '@mtcute/core'

/**
 * Verify an email to use as 2FA recovery method
 *
 * @param code  Code which was sent via email
 */
export async function verifyPasswordEmail(client: BaseTelegramClient, code: string): Promise<void> {
    await client.call({
        _: 'account.confirmPasswordEmail',
        code,
    })
}

/**
 * Resend the code to verify an email to use as 2FA recovery method.
 */
export async function resendPasswordEmail(client: BaseTelegramClient): Promise<void> {
    await client.call({
        _: 'account.resendPasswordEmail',
    })
}

/**
 * Cancel the code that was sent to verify an email to use as 2FA recovery method
 */
export async function cancelPasswordEmail(client: BaseTelegramClient): Promise<void> {
    await client.call({
        _: 'account.cancelPasswordEmail',
    })
}
