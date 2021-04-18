import { TelegramClient } from '../../client'

// @extension
interface AuthState {
    // local copy of "self" in storage,
    // so we can use it w/out relying on storage.
    // they are both loaded and saved to storage along with the updates
    // (see methods/updates/handle-update)
    _userId: number | null
    _isBot: boolean
}

// @initialize
function _initializeAuthState(this: TelegramClient) {
    this._userId = null
    this._isBot = false
}
