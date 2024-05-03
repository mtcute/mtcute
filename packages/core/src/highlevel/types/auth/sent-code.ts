import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'

const sentCodeMap: Record<tl.auth.TypeSentCodeType['_'], SentCodeDeliveryType> = {
    'auth.sentCodeTypeApp': 'app',
    'auth.sentCodeTypeCall': 'call',
    'auth.sentCodeTypeFlashCall': 'flash_call',
    'auth.sentCodeTypeSms': 'sms',
    'auth.sentCodeTypeMissedCall': 'missed_call',
    'auth.sentCodeTypeEmailCode': 'email',
    'auth.sentCodeTypeSetUpEmailRequired': 'email_required',
    'auth.sentCodeTypeFragmentSms': 'fragment',
    'auth.sentCodeTypeFirebaseSms': 'firebase',
    'auth.sentCodeTypeSmsWord': 'sms_word',
    'auth.sentCodeTypeSmsPhrase': 'sms_phrase',
}

const nextCodeMap: Record<tl.auth.TypeCodeType['_'], NextCodeDeliveryType> = {
    'auth.codeTypeCall': 'call',
    'auth.codeTypeFlashCall': 'flash_call',
    'auth.codeTypeSms': 'sms',
    'auth.codeTypeMissedCall': 'missed_call',
    'auth.codeTypeFragmentSms': 'fragment',
}

/**
 * Type describing code delivery type.
 * - `app`: Code is delivered via Telegram account
 * - `sms`: Code is sent via SMS
 * - `call`: Code is sent via voice call
 * - `flash_call`: Code is the last 5 digits of the caller's phone number
 * - `missed_call`: Code is the last 5 digits of the caller's phone number
 * - `email`: Code is sent via Email
 * - `email_required`: Code sending via email setup is required
 * - `fragment`: Code is sent via Fragment anonymous numbers
 * - `firebase`: Code is sent via Firebase
 * - `sms_word`, `sms_phrase`: Code is sent via SMS with a word/phrase (see {@link SentCode#beginning})
 * - `success`: Code is not needed, you're already logged in (only for future auth tokens)
 */
export type SentCodeDeliveryType =
    | 'app'
    | 'sms'
    | 'call'
    | 'flash_call'
    | 'missed_call'
    | 'email'
    | 'email_required'
    | 'fragment'
    | 'firebase'
    | 'sms_word'
    | 'sms_phrase'
    | 'success'

/**
 * Type describing next code delivery type.
 * See {@link DeliveryType} for information on values.
 *
 * Additionally, can be `none` if no more types are available
 */
export type NextCodeDeliveryType = Exclude<SentCodeDeliveryType, 'app'> | 'none'

/**
 * Information about sent confirmation code
 */
export class SentCode {
    constructor(readonly raw: tl.auth.RawSentCode) {}

    /**
     * Type of currently sent confirmation code
     */
    get type(): SentCodeDeliveryType {
        return sentCodeMap[this.raw.type._]
    }

    /**
     * Type of the confirmation code that will be sent
     * if you call {@link TelegramClient.resendCode}.
     */
    get nextType(): NextCodeDeliveryType {
        return this.raw.nextType ? nextCodeMap[this.raw.nextType._] : 'none'
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
     * If the code is sent via SMS with a word/phrase, this field *may* contain the beginning of the message
     */
    get beginning(): string | undefined {
        switch (this.raw.type._) {
            case 'auth.sentCodeTypeSmsPhrase':
            case 'auth.sentCodeTypeSmsWord':
                return this.raw.type.beginning
            default:
                return undefined
        }
    }

    /**
     * Length of the code (0 for flash calls)
     */
    get length(): number {
        return 'length' in this.raw.type ? this.raw.type.length : 0
    }
}

makeInspectable(SentCode)
