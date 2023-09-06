import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import {
    MaybeAsync,
    MaybeDynamic,
    MtArgumentError,
    SentCode,
    TermsOfService,
    User,
} from '../../types'
import {
    normalizePhoneNumber,
    resolveMaybeDynamic,
} from '../../utils/misc-utils'

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
 *
 * @internal
 */
export async function start(
    this: TelegramClient,
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
         * First name of the user (used only for sign-up, defaults to 'User')
         */
        firstName?: MaybeDynamic<string>

        /**
         * Last name of the user (used only for sign-up, defaults to empty)
         */
        lastName?: MaybeDynamic<string>

        /**
         * By using this method to sign up an account, you are agreeing to Telegram
         * ToS. This is required and your account will be banned otherwise.
         * See https://telegram.org/tos and https://core.telegram.org/api/terms.
         *
         * If true, TOS will not be displayed and `tosCallback` will not be called.
         */
        acceptTos?: boolean

        /**
         * Custom method to display ToS. Can be used to show a GUI alert of some kind.
         * Defaults to `console.log`
         */
        tosCallback?: (tos: TermsOfService) => MaybeAsync<void>

        /**
         * Custom method that is called when a code is sent. Can be used
         * to show a GUI alert of some kind.
         * Defaults to `console.log`.
         *
         * This method is called *before* {@link TelegramClient.start.params.code}.
         *
         * @param code
         */
        codeSentCallback?: (code: SentCode) => MaybeAsync<void>

        /**
         * Whether to "catch up" (load missed updates).
         * Only applicable if the saved session already
         * contained authorization and updates state.
         *
         * Note: you should register your handlers
         * before calling `start()`, otherwise they will
         * not be called.
         *
         * Note: In case the storage was not properly
         * closed the last time, "catching up" might
         * result in duplicate updates.
         *
         * Defaults to `false`.
         */
        catchUp?: boolean
    },
): Promise<User> {
    if (params.session) {
        this.importSession(params.session, params.sessionForce)
    }

    try {
        const me = await this.getMe()

        // user is already authorized

        this.log.prefix = `[USER ${me.id}] `
        this.log.info(
            'Logged in as %s (ID: %s, username: %s, bot: %s)',
            me.displayName,
            me.id,
            me.username,
            me.isBot,
        )

        this.network.setIsPremium(me.isPremium)

        if (!this.network.params.disableUpdates) {
            this._catchUpChannels = Boolean(params.catchUp)

            if (!params.catchUp) {
                // otherwise we will catch up as soon as we receive a new update
                await this._fetchUpdatesState()
            }

            this.startUpdatesLoop()

            if (params.catchUp) {
                this.catchUp()
            }
        }

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
        const botToken = params.botToken ?
            await resolveMaybeDynamic(params.botToken) :
            null

        if (!botToken) {
            throw new MtArgumentError(
                'Either bot token or phone number must be provided',
            )
        }

        return await this.signInBot(botToken)
    }

    let sentCode = await this.sendCode(phone)

    if (params.forceSms && sentCode.type === 'app') {
        sentCode = await this.resendCode(phone, sentCode.phoneCodeHash)
    }

    if (params.codeSentCallback) {
        await params.codeSentCallback(sentCode)
    } else {
        console.log(`The confirmation code has been sent via ${sentCode.type}.`)
    }

    let has2fa = false

    let result: User | TermsOfService | false

    for (;;) {
        const code = await resolveMaybeDynamic(params.code)
        if (!code) throw new tl.RpcError(400, 'PHONE_CODE_EMPTY')

        try {
            result = await this.signIn(phone, sentCode.phoneCodeHash, code)
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
            throw new MtArgumentError(
                '2FA is enabled, but `password` was not provided.',
            )
        }

        for (;;) {
            const password = await resolveMaybeDynamic(params.password)

            try {
                result = await this.checkPassword(password)
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

            break
        }
    }

    // to make ts happy
    result = result!

    if (result instanceof User) {
        return result
    }

    let tosId: string | null = null

    if (result instanceof TermsOfService && !params.acceptTos) {
        if (params.tosCallback) {
            await params.tosCallback(result)
        } else {
            console.log(result.text)
        }

        tosId = result.id
    }

    // signup
    result = await this.signUp(
        phone,
        sentCode.phoneCodeHash,
        await resolveMaybeDynamic(params.firstName ?? 'User'),
        await resolveMaybeDynamic(params.lastName),
    )

    if (tosId) {
        await this.acceptTos(tosId)
    }

    return result
}
