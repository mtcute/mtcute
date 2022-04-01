import { TelegramClient } from '../../client'

// @extension
interface AuthState {
    // local copy of "self" in storage,
    // so we can use it w/out relying on storage.
    // they are both loaded and saved to storage along with the updates
    // (see methods/updates)
    _userId: number | null
    _isBot: boolean

    _selfUsername: string | null
}

// @initialize
function _initializeAuthState(this: TelegramClient) {
    this._userId = null
    this._isBot = false
    this._selfUsername = null
    this.log.prefix = '[USER N/A] '
}
