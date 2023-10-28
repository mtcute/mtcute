import { BaseTelegramClient, tl } from '@mtcute/core'
import { computeSrpParams, utf8EncodeToBuffer } from '@mtcute/core/utils.js'

import { InputMessageId, normalizeInputMessageId } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Request a callback answer from a bot,
 * i.e. click an inline button that contains data.
 *
 * @param params
 */
export async function getCallbackAnswer(
    client: BaseTelegramClient,
    params: InputMessageId & {
        /** Data contained in the button */
        data: string | Uint8Array

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
    const { chatId, message } = normalizeInputMessageId(params)
    const { data, game, timeout = 10000 } = params

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
            data: typeof data === 'string' ? utf8EncodeToBuffer(data) : data,
            password,
            game: game,
        },
        { timeout },
    )
}
