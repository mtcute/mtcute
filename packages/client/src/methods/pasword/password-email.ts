import { TelegramClient } from '../../client'

/**
 * Verify an email to use as 2FA recovery method
 *
 * @param code  Code which was sent via email
 * @internal
 */
export async function verifyPasswordEmail(this: TelegramClient, code: string): Promise<void> {
    await this.call({
        _: 'account.confirmPasswordEmail',
        code,
    })
}

/**
 * Resend the code to verify an email to use as 2FA recovery method.
 *
 * @internal
 */
export async function resendPasswordEmail(this: TelegramClient): Promise<void> {
    await this.call({
        _: 'account.resendPasswordEmail',
    })
}

/**
 * Cancel the code that was sent to verify an email to use as 2FA recovery method
 *
 * @internal
 */
export async function cancelPasswordEmail(this: TelegramClient): Promise<void> {
    await this.call({
        _: 'account.cancelPasswordEmail',
    })
}
