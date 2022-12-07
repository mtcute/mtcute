import { tl } from '@mtcute/tl'

import { makeInspectable } from '../utils'

const sentCodeMap: Record<
    tl.auth.TypeSentCodeType['_'],
    SentCode.DeliveryType
> = {
    'auth.sentCodeTypeApp': 'app',
    'auth.sentCodeTypeCall': 'call',
    'auth.sentCodeTypeFlashCall': 'flash_call',
    'auth.sentCodeTypeSms': 'sms',
    'auth.sentCodeTypeMissedCall': 'missed_call',
    'auth.sentCodeTypeEmailCode': 'email',
    'auth.sentCodeTypeSetUpEmailRequired': 'email_required',
    "auth.sentCodeTypeFragmentSms": 'fragment'
}

const nextCodeMap: Record<
    tl.auth.TypeCodeType['_'],
    SentCode.NextDeliveryType
> = {
    'auth.codeTypeCall': 'call',
    'auth.codeTypeFlashCall': 'flash_call',
    'auth.codeTypeSms': 'sms',
    'auth.codeTypeMissedCall': 'missed_call',
    'auth.codeTypeFragmentSms': 'fragment',
}

export namespace SentCode {
    /**
     * Type describing code delivery type.
     * - `app`: Code is delivered via Telegram account
     * - `sms`: Code is sent via SMS
     * - `call`: Code is sent via voice call
     * - `flash_call`: Code is the last 5 digits of the caller's phone number
     */
    export type DeliveryType =
        | 'app'
        | 'sms'
        | 'call'
        | 'flash_call'
        | 'missed_call'
        | 'email'
        | 'email_required'
        | 'fragment'

    /**
     * Type describing next code delivery type.
     * See {@link DeliveryType} for information on values.
     *
     * Additionally, can be `none` if no more types are available
     */
    export type NextDeliveryType = Exclude<DeliveryType, 'app'> | 'none'
}

/**
 * Information about sent confirmation code
 */
export class SentCode {
    constructor(readonly raw: tl.auth.TypeSentCode) {
    }

    /**
     * Type of currently sent confirmation code
     */
    get type(): SentCode.DeliveryType {
        return sentCodeMap[this.raw.type._]
    }

    /**
     * Type of the confirmation code that will be sent
     * if you call {@link TelegramClient.resendCode}.
     */
    get nextType(): SentCode.NextDeliveryType {
        return this.raw.nextType
            ? nextCodeMap[this.raw.nextType._]
            : 'none'
    }

    /**
     * Confirmation code identifier used for the next authorization steps
     * (like {@link TelegramClient.signIn} and {@link TelegramClient.signUp})
     */
    get phoneCodeHash(): string {
        return this.raw.phoneCodeHash
    }

    /**
     * Delay in seconds to wait before calling {@link TelegramClient.resendCode}
     */
    get timeout(): number {
        return this.raw.timeout ?? 0
    }

    /**
     * Length of the code (0 for flash calls)
     */
    get length(): number {
        return 'length' in this.raw.type ? this.raw.type.length : 0
    }
}

makeInspectable(SentCode)
