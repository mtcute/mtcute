import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'
import { tl } from '@mtcute/tl'
import { computeSrpParams } from '@mtcute/core'

/**
 * Request a callback answer from a bot,
 * i.e. click an inline button that contains data.
 *
 * @param chatId  Chat ID where the message was found
 * @param message  ID of the message containing the button
 * @param data  Data contained in the button
 * @param params
 * @internal
 */
export async function getCallbackAnswer(
    this: TelegramClient,
    chatId: InputPeerLike,
    message: number,
    data: string | Buffer,
    params?: {
        /**
         * Timeout for the query in ms.
         *
         * Defaults to `10000` (10 sec)
         */
        timeout?: number

        /**
         * Whether this is a "play game" button
         */
        game?: boolean

        /**
         * If the button requires password entry,
         * your 2FA password.
         *
         * Your password is never exposed to the
         * bot, it is checked by Telegram.
         */
        password?: string
    }
): Promise<tl.messages.TypeBotCallbackAnswer> {
    let password: tl.TypeInputCheckPasswordSRP | undefined = undefined
    if (params?.password) {
        const pwd = await this.call({ _: 'account.getPassword' })
        password = await computeSrpParams(this._crypto, pwd, params.password)
    }

    return await this.call(
        {
            _: 'messages.getBotCallbackAnswer',
            peer: await this.resolvePeer(chatId),
            msgId: message,
            data: typeof data === 'string' ? Buffer.from(data) : data,
            password,
            game: params?.game,
        },
        { timeout: params?.timeout ?? 10000 }
    )
}
