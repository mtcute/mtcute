import { TelegramClient } from '../../client'
import { User } from '../../types'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * Authorize a bot using its token issued by [@BotFather](//t.me/BotFather)
 *
 * @param token  Bot token issued by BotFather
 * @returns  Bot's {@link User} object
 * @throws BadRequestError  In case the bot token is invalid
 * @internal
 */
export async function signInBot(
    this: TelegramClient,
    token: string
): Promise<User> {
    const res = await this.call({
        _: 'auth.importBotAuthorization',
        flags: 0,
        apiId: this._initConnectionParams.apiId,
        apiHash: this._apiHash,
        botAuthToken: token,
    })

    assertTypeIs(
        'signInBot (@ auth.importBotAuthorization)',
        res,
        'auth.authorization'
    )
    assertTypeIs(
        'signInBot (@ auth.importBotAuthorization -> user)',
        res.user,
        'user'
    )

    this.log.prefix = `[USER ${this._userId}] `
    this._userId = res.user.id
    this._isBot = true
    this._selfUsername = res.user.username!
    this._selfChanged = true
    await this._fetchUpdatesState()
    await this._saveStorage()

    // telegram ignores invokeWithoutUpdates for auth methods
    if (this._disableUpdates) this.primaryConnection._resetSession()
    else this.startUpdatesLoop()

    return new User(this, res.user)
}
