import { join } from 'path'
import * as url from 'url'

export const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const DOC_CACHE_FILE = join(__dirname, '.documentation.cache.json')
export const DESCRIPTIONS_YAML_FILE = join(__dirname, '../data/descriptions.yaml')
export const API_SCHEMA_JSON_FILE = join(__dirname, '../api-schema.json')
export const API_SCHEMA_DIFF_JSON_FILE = join(__dirname, '../diff.json')
export const MTP_SCHEMA_JSON_FILE = join(__dirname, '../mtp-schema.json')
export const ERRORS_JSON_FILE = join(__dirname, '../raw-errors.json')

export const CORE_DOMAIN = 'https://core.telegram.org'
export const COREFORK_DOMAIN = 'https://corefork.telegram.org'
export const BLOGFORK_DOMAIN = 'https://blogfork.telegram.org'

export const TDESKTOP_SCHEMA =
    'https://raw.githubusercontent.com/telegramdesktop/tdesktop/dev/Telegram/SourceFiles/mtproto/scheme/api.tl'
export const TDESKTOP_LAYER =
    'https://raw.githubusercontent.com/telegramdesktop/tdesktop/dev/Telegram/SourceFiles/mtproto/scheme/layer.tl'
export const TDLIB_SCHEMA = 'https://raw.githubusercontent.com/tdlib/td/master/td/generate/scheme/telegram_api.tl'

export const ESM_PRELUDE = `// This file is auto-generated. Do not edit.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
`
