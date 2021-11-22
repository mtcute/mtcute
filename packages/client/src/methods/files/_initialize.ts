import { SessionConnection } from '@mtcute/core'

import { TelegramClient } from '../../client'

// @extension
interface FilesExtension {
    _downloadConnections: Record<number, SessionConnection>
}

// @initialize
function _initializeFiles(this: TelegramClient): void {
    this._downloadConnections = {}
}
