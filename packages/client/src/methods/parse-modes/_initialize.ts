import { IMessageEntityParser } from '../../types'
import { TelegramClient } from '../../client'

// @extension
interface ParseModesExtension {
    _parseModes: Record<string, IMessageEntityParser>
    _defaultParseMode: string | null
}

// @initialize
function _initializeParseModes(this: TelegramClient) {
    this._parseModes = {}
    this._defaultParseMode = null
}

// since IMessageEntityParser is copied here, we don't need to
// worry about marking it with @copy anywhere else.
