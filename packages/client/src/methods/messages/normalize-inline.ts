import { tl } from '@mtcute/tl'
import { SessionConnection } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { parseInlineMessageId } from '../../utils/inline-utils'

// @extension
interface InlineExtension {
    _connectionsForInline: Record<number, SessionConnection>
}

// @initialize
function _initializeInline(this: TelegramClient) {
    this._connectionsForInline = {}
}

/** @internal */
export async function _normalizeInline(
    this: TelegramClient,
    id: string | tl.TypeInputBotInlineMessageID
): Promise<[tl.TypeInputBotInlineMessageID, SessionConnection]> {
    if (typeof id === 'string') {
        id = parseInlineMessageId(id)
    }

    let connection = this.primaryConnection
    if (id.dcId !== connection.params.dc.id) {
        if (!(id.dcId in this._connectionsForInline)) {
            this._connectionsForInline[id.dcId] =
                await this.createAdditionalConnection(id.dcId)
        }
        connection = this._connectionsForInline[id.dcId]
    }

    return [id, connection]
}
