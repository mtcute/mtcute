/* eslint-disable no-console */
import { BaseTelegramClient, MaybeAsync, MtArgumentError, tl } from '@mtcute/core'

import { MaybeDynamic, SentCode, User } from '../../types/index.js'
import { normalizePhoneNumber, resolveMaybeDynamic } from '../../utils/misc-utils.js'
import { getMe } from '../users/get-me.js'
import { checkPassword } from './check-password.js'
import { resendCode } from './resend-code.js'
import { sendCode } from './send-code.js'
import { signIn } from './sign-in.js'
import { signInBot } from './sign-in-bot.js'

// @manual
// @available=both
/**
 * Start the client in an interactive and declarative manner,
 * by providing callbacks for authorization details.
 *
 * This method handles both login and sign up, and also handles 2FV
 *
 * All parameters are `MaybeDynamic<T>`, meaning you
 * can either supply `T`, or a function that returns `MaybeAsync<T>`
 *
 * This method is intended for simple and fast use in automated
 * scripts and bots. If you are developing a custom client,
 * you'll probably need to use other auth methods.
 */
export async function start(
    client: BaseTelegramClient,
    params: {
        /**
         * String session exported using {@link TelegramClient.exportSession}.
         *
         * This simply calls {@link TelegramClient.importSession} before anything else.
         *
         * Note that passed session will be ignored in case storage already
         * contains authorization.
         */
        session?: string

        /**
         * Whether to overwrite existing session.
         */
        sessionForce?: boolean

        /**
         * Phone number of the account.
         * If account does not exist, it will be created
         */
        phone?: MaybeDynamic<string>

        /**
         * Bot token to use. Ignored if `phone` is supplied.
         */
        botToken?: MaybeDynamic<string>

        /**
         * 2FA password. Ignored if `botToken` is supplied
         */
        password?: MaybeDynamic<string>

        /**
         * Code sent to the phone (either sms, call, flash call or other).
         * Ignored if `botToken` is supplied, must be present if `phone` is supplied.
         */
        code?: MaybeDynamic<string>

        /**
         * If passed, this function will be called if provided code or 2FA password
         * was invalid. New code/password will be requested later.
         *
         * If provided `code`/`password` is a constant string, providing an
         * invalid one will interrupt authorization flow.
         */
        invalidCodeCallback?: (type: 'code' | 'password') => MaybeAsync<void>

        /**
         * Whether to force code delivery through SMS
         */
        forceSms?: boolean

        /**
         * Custom method that is called when a code is sent. Can be used
         * to show a GUI alert of some kind.
         * Defaults to `console.log`.
         *
         * This method is called *before* {@link start.params.code}.
         *
         * @param code
         */
        codeSentCallback?: (code: SentCode) => MaybeAsync<void>
    },
): Promise<User> {
    if (params.session) {
        client.importSession(params.session, params.sessionForce)
    }

    try {
        const me = await getMe(client)

        // user is already authorized

        client.log.info('Logged in as %s (ID: %s, username: %s, bot: %s)', me.displayName, me.id, me.username, me.isBot)

        client.network.setIsPremium(me.isPremium)

        return me
    } catch (e) {
        if (!tl.RpcError.is(e, 'AUTH_KEY_UNREGISTERED')) throw e
    }

    if (!params.phone && !params.botToken) {
        throw new MtArgumentError('Neither phone nor bot token were provided')
    }

    let phone = params.phone ? await resolveMaybeDynamic(params.phone) : null

    if (phone) {
        phone = normalizePhoneNumber(phone)

        if (!params.code) {
            throw new MtArgumentError('You must pass `code` to use `phone`')
        }
    } else {
        const botToken = params.botToken ? await resolveMaybeDynamic(params.botToken) : null

        if (!botToken) {
            throw new MtArgumentError('Either bot token or phone number must be provided')
        }

        return await signInBot(client, botToken)
    }

    let sentCode = await sendCode(client, { phone })

    if (params.forceSms && sentCode.type === 'app') {
        sentCode = await resendCode(client, { phone, phoneCodeHash: sentCode.phoneCodeHash })
    }

    if (params.codeSentCallback) {
        await params.codeSentCallback(sentCode)
    } else {
        console.log(`The confirmation code has been sent via ${sentCode.type}.`)
    }

    let has2fa = false

    for (;;) {
        const code = await resolveMaybeDynamic(params.code)
        if (!code) throw new tl.RpcError(400, 'PHONE_CODE_EMPTY')

        try {
            return await signIn(client, { phone, phoneCodeHash: sentCode.phoneCodeHash, phoneCode: code })
        } catch (e) {
            if (!tl.RpcError.is(e)) throw e

            if (e.is('SESSION_PASSWORD_NEEDED')) {
                has2fa = true
                break
            } else if (
                e.is('PHONE_CODE_EMPTY') ||
                e.is('PHONE_CODE_EXPIRED') ||
                e.is('PHONE_CODE_INVALID') ||
                e.is('PHONE_CODE_HASH_EMPTY')
            ) {
                if (typeof params.code !== 'function') {
                    throw new MtArgumentError('Provided code was invalid')
                }

                if (params.invalidCodeCallback) {
                    await params.invalidCodeCallback('code')
                } else {
                    console.log('Invalid code. Please try again')
                }

                continue
            } else throw e
        }

        // if there was no error, code was valid, so it's either 2fa or signup
        break
    }

    if (has2fa) {
        if (!params.password) {
            throw new MtArgumentError('2FA is enabled, but `password` was not provided.')
        }

        for (;;) {
            const password = await resolveMaybeDynamic(params.password)

            try {
                return await checkPassword(client, password)
            } catch (e) {
                if (typeof params.password !== 'function') {
                    throw new MtArgumentError('Provided password was invalid')
                }

                if (tl.RpcError.is(e, 'PASSWORD_HASH_INVALID')) {
                    if (params.invalidCodeCallback) {
                        await params.invalidCodeCallback('password')
                    } else {
                        console.log('Invalid password. Please try again')
                    }
                    continue
                } else throw e
            }
        }
    }

    throw new MtArgumentError('Failed to log in with provided credentials')
}
