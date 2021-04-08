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
}

const nextCodeMap: Record<
    tl.auth.TypeCodeType['_'],
    SentCode.NextDeliveryType
> = {
    'auth.codeTypeCall': 'call',
    'auth.codeTypeFlashCall': 'flash_call',
    'auth.codeTypeSms': 'sms',
}

export namespace SentCode {
    /**
     * Type describing code delivery type.
     * - `app`: Code is delivered via Telegram account
     * - `sms`: Code is sent via SMS
     * - `call`: Code is sent via voice call
     * - `flash_call`: Code is the last 5 digits of the caller's phone number
     */
    export type DeliveryType = 'app' | 'sms' | 'call' | 'flash_call'

    /**
     * Type describing next code delivery type.
     * See {@link DeliveryType} for information on values.
     *
     * Additionally, can be `none` if no more types are available
     * (this has never occurred in real life though)
     */
    export type NextDeliveryType = Exclude<DeliveryType, 'app'> | 'none'
}

/**
 * Information about sent confirmation code
 */
export class SentCode {
    /**
     * Underlying raw TL object
     */
    readonly sentCode: tl.auth.TypeSentCode

    constructor(obj: tl.auth.TypeSentCode) {
        this.sentCode = obj
    }

    /**
     * Type of currently sent confirmation code
     */
    get type(): SentCode.DeliveryType {
        return sentCodeMap[this.sentCode.type._]
    }

    /**
     * Type of the confirmation code that will be sent
     * if you call {@link TelegramClient.resendCode}.
     */
    get nextType(): SentCode.NextDeliveryType {
        return this.sentCode.nextType
            ? nextCodeMap[this.sentCode.nextType._]
            : 'none'
    }

    /**
     * Confirmation code identifier used for the next authorization steps
     * (like {@link TelegramClient.signIn} and {@link TelegramClient.signUp})
     */
    get phoneCodeHash(): string {
        return this.sentCode.phoneCodeHash
    }

    /**
     * Delay in seconds to wait before calling {@link TelegramClient.resendCode}
     */
    get timeout(): number {
        return this.sentCode.timeout ?? 0
    }
}

makeInspectable(SentCode)
