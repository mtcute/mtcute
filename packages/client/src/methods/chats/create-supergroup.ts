import { TelegramClient } from '../../client'
import { Chat, MtCuteTypeAssertionError } from '../../types'

/**
 * Create a new supergroup
 *
 * @param title  Title of the supergroup
 * @param description  Description of the supergroup
 * @internal
 */
export async function createSupergroup(
    this: TelegramClient,
    title: string,
    description = ''
): Promise<Chat> {
    const res = await this.call({
        _: 'channels.createChannel',
        title,
        about: description,
        megagroup: true
    })

    if (!(res._ === 'updates' || res._ === 'updatesCombined')) {
        throw new MtCuteTypeAssertionError(
            'channels.createChannel',
            'updates | updatesCombined',
            res._
        )
    }

    this._handleUpdate(res)

    return new Chat(this, res.chats[0])
}
