import { TelegramConnection } from '@mtqt/core'

import { TelegramClient } from '../../client'

// @extension
interface FilesExtension {
    _downloadConnections: Record<number, TelegramConnection>
}

// @initialize
function _initializeFiles(this: TelegramClient): void {
    this._downloadConnections = {}
}
