import { BaseTelegramClient, tl } from '@mtcute/core'
import { computeSrpParams } from '@mtcute/core/utils'

import { InputPeerLike } from '../../types'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Request a callback answer from a bot,
 * i.e. click an inline button that contains data.
 *
 * @param params
 */
export async function getCallbackAnswer(
    client: BaseTelegramClient,
    params: {
        /** Chat ID where the message was found */
        chatId: InputPeerLike

        /** ID of the message containing the button */
        message: number

        /** Data contained in the button */
        data: string | Buffer

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
         * If the button requires password entry, your 2FA password.
         *
         * Your password is never exposed to the bot,
         * it is checked by Telegram.
         */
        password?: string
    },
): Promise<tl.messages.TypeBotCallbackAnswer> {
    const { chatId, message, data, game, timeout = 10000 } = params

    let password: tl.TypeInputCheckPasswordSRP | undefined = undefined

    if (params?.password) {
        const pwd = await client.call({ _: 'account.getPassword' })
        password = await computeSrpParams(client.crypto, pwd, params.password)
    }

    return await client.call(
        {
            _: 'messages.getBotCallbackAnswer',
            peer: await resolvePeer(client, chatId),
            msgId: message,
            data: typeof data === 'string' ? Buffer.from(data) : data,
            password,
            game: game,
        },
        { timeout },
    )
}
