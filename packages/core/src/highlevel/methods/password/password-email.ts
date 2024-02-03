import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'

/**
 * Verify an email to use as 2FA recovery method
 *
 * @param code  Code which was sent via email
 */
export async function verifyPasswordEmail(client: ITelegramClient, code: string): Promise<void> {
    const r = await client.call({
        _: 'account.confirmPasswordEmail',
        code,
    })

    assertTrue('account.confirmPasswordEmail', r)
}

/**
 * Resend the code to verify an email to use as 2FA recovery method.
 */
export async function resendPasswordEmail(client: ITelegramClient): Promise<void> {
    const r = await client.call({
        _: 'account.resendPasswordEmail',
    })

    assertTrue('account.resendPasswordEmail', r)
}

/**
 * Cancel the code that was sent to verify an email to use as 2FA recovery method
 */
export async function cancelPasswordEmail(client: ITelegramClient): Promise<void> {
    const r = await client.call({
        _: 'account.cancelPasswordEmail',
    })

    assertTrue('account.cancelPasswordEmail', r)
}
