import { TelegramClient } from '../../client'
import { MtqtTypeAssertionError } from '../../types'

/**
 * Accept the given TOS
 *
 * @param tosId  TOS id
 * @internal
 */
export async function acceptTos(
    this: TelegramClient,
    tosId: string
): Promise<boolean> {
    const res = await this.call({
        _: 'help.acceptTermsOfService',
        id: {
            _: 'dataJSON',
            data: tosId,
        },
    })

    if (!res)
        throw new MtqtTypeAssertionError(
            'help.acceptTermsOfService',
            'true',
            'false'
        )

    return true
}
