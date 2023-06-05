import { TelegramClient } from '../../client'
import { SentCode } from '../../types'
import { normalizePhoneNumber } from '../../utils/misc-utils'

/**
 * Send the confirmation code to the given phone number
 *
 * @param phone  Phone number in international format.
 * @returns  An object containing information about the sent confirmation code
 * @internal
 */
export async function sendCode(
    this: TelegramClient,
    phone: string,
): Promise<SentCode> {
    phone = normalizePhoneNumber(phone)

    const res = await this.call({
        _: 'auth.sendCode',
        phoneNumber: phone,
        apiId: this._initConnectionParams.apiId,
        apiHash: this._apiHash,
        settings: { _: 'codeSettings' },
    })

    return new SentCode(res)
}
