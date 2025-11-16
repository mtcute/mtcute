/* eslint-disable no-console */
import type { MaybePromise } from '../../../types/utils.js'

import type { ITelegramClient } from '../../client.types.js'
import type { SentCode } from '../../types/auth/sent-code.js'
import type { MaybeDynamic } from '../../types/utils.js'
import type { InputStringSessionData } from '../../utils/string-session.js'
import { tl } from '@mtcute/tl'
import { MtArgumentError, MtcuteError } from '../../../types/errors.js'
import { User } from '../../types/peers/user.js'
import { normalizePhoneNumber, resolveMaybeDynamic } from '../../utils/misc-utils.js'

import { getMe } from '../users/get-me.js'
import { checkPassword } from './check-password.js'
import { logOut } from './log-out.js'
import { resendCode } from './resend-code.js'
import { sendCode } from './send-code.js'
import { signInBot } from './sign-in-bot.js'
import { signInQr } from './sign-in-qr.js'
import { signIn } from './sign-in.js'

// @available=both
/**
 * Start the client in an interactive and declarative manner,
 * by providing callbacks for authorization details.
 *
 * This method handles both login and sign up, and also handles 2FV
 *
 * All parameters are `MaybeDynamic<T>`, meaning you
 * can either supply `T`, or a function that returns `MaybePromise<T>`
 *
 * This method is intended for *interactive* login.
 * If you are building some kind of headless service, you will most likely
 * want to use the underlying authorization methods directly.
 */
export async function start(
  client: ITelegramClient,
  params: {
    /**
     * String session exported using {@link TelegramClient.exportSession}.
     *
     * This simply calls {@link TelegramClient.importSession} before anything else.
     *
     * Note that passed session will be ignored in case storage already
     * contains authorization.
     */
    session?: string | InputStringSessionData

    /**
     * Whether to overwrite existing session.
     */
    sessionForce?: boolean

    /**
     * When passed, [QR login flow](https://core.telegram.org/api/qr-login)
     * will be used instead of the regular login flow.
     *
     * This function will be called whenever the login URL is changed,
     * and the app is expected to display it as a QR code to the user.
     */
    qrCodeHandler?: (url: string, expires: Date) => void

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
    invalidCodeCallback?: (type: 'code' | 'password') => MaybePromise<void>

    /**
     * Whether to force code delivery through SMS
     */
    forceSms?: boolean

    /**
     * Custom method that is called when a code is sent. Can be used
     * to show a GUI alert of some kind.
     *
     * This method is called *before* {@link start.params.code}.
     *
     * @param code
     * @default  `console.log`.
     */
    codeSentCallback?: (code: SentCode) => MaybePromise<void>

    /** Saved future auth tokens, if any */
    futureAuthTokens?: Uint8Array[]

    /** Additional code settings to pass to the server */
    codeSettings?: Omit<tl.RawCodeSettings, '_' | 'logoutTokens'>

    /** Abort signal */
    abortSignal?: AbortSignal
  },
): Promise<User> {
  if (params.session) {
    await client.importSession(params.session, params.sessionForce)
  }

  const { abortSignal } = params

  let has2fa = false
  let sentCode: SentCode | undefined
  let phone: string | null = null

  try {
    const me = await getMe(client)

    // user is already authorized

    client.log.info('Logged in as %s (ID: %s, username: %s, bot: %s)', me.displayName, me.id, me.username, me.isBot)

    await client.notifyLoggedIn(me.raw)

    return me
  } catch (e) {
    if (tl.RpcError.is(e)) {
      if (e.text === 'SESSION_PASSWORD_NEEDED') {
        has2fa = true
      } else if (e.text === 'SESSION_REVOKED' || e.text === 'USER_DEACTIVATED' || e.text === 'USER_DEACTIVATED_BAN') {
        // session is dead, we need to explicitly log out before we can log in again
        await logOut(client).catch((err) => {
          client.log.warn('failed to log out: %e', err)
        })
      } else if (e.text !== 'AUTH_KEY_UNREGISTERED') {
        throw e
      }
    } else {
      throw e
    }
  }

  // if has2fa == true, then we are half-logged in, but need to enter password
  if (!has2fa && !params.qrCodeHandler) {
    if (!params.phone && !params.botToken) {
      throw new MtArgumentError('Neither phone nor bot token were provided')
    }

    phone = params.phone ? await resolveMaybeDynamic(params.phone) : null

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

      return signInBot(client, botToken)
    }

    try {
      const res = await sendCode(client, {
        phone,
        futureAuthTokens: params.futureAuthTokens,
        codeSettings: params.codeSettings,
        abortSignal,
      })
      if (res instanceof User) {
        return res
      }
      sentCode = res
    } catch (e) {
      if (tl.RpcError.is(e, 'SESSION_PASSWORD_NEEDED')) {
        has2fa = true
      } else {
        throw e
      }
    }
  }

  if (sentCode) {
    if (params.forceSms && (sentCode.type === 'app' || sentCode.type === 'email')) {
      sentCode = await resendCode(client, {
        phone: phone!,
        phoneCodeHash: sentCode.phoneCodeHash,
        abortSignal,
      })
    }

    if (params.codeSentCallback) {
      await params.codeSentCallback(sentCode)
    } else {
      if (sentCode.type === 'email_required') {
        throw new MtcuteError('Email login setup is required to sign in')
      }

      console.log(`The confirmation code has been sent via ${sentCode.type}.`)
    }

    for (;;) {
      const code = await resolveMaybeDynamic(params.code)
      if (!code) throw new tl.RpcError(400, 'PHONE_CODE_EMPTY')

      try {
        return await signIn(client, {
          phone: phone!,
          phoneCodeHash: sentCode.phoneCodeHash,
          phoneCode: code,
          abortSignal,
        })
      } catch (e) {
        if (!tl.RpcError.is(e)) throw e

        if (e.is('SESSION_PASSWORD_NEEDED')) {
          has2fa = true
          break
        } else if (
          e.is('PHONE_CODE_EMPTY')
          || e.is('PHONE_CODE_EXPIRED')
          || e.is('PHONE_CODE_INVALID')
          || e.is('PHONE_CODE_HASH_EMPTY')
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
        } else {
          throw e
        }
      }

      // if there was no error, code was valid, so it's either 2fa or signup
      break
    }
  }

  if (has2fa) {
    if (!params.password) {
      throw new MtArgumentError('2FA is enabled, but `password` was not provided.')
    }

    for (;;) {
      const password = await resolveMaybeDynamic(params.password)

      try {
        return await checkPassword(client, {
          password,
          abortSignal,
        })
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
        } else {
          throw e
        }
      }
    }
  }

  if (params.qrCodeHandler) {
    return signInQr(client, {
      onUrlUpdated: params.qrCodeHandler,
      password: params.password,
      invalidPasswordCallback: params.invalidCodeCallback
        ? () => params.invalidCodeCallback!('password')
        : undefined,
      abortSignal,
    })
  }

  throw new MtArgumentError('Failed to log in with provided credentials')
}
