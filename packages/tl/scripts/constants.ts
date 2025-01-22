import { join } from 'node:path'
import * as url from 'node:url'

export const __dirname: string = url.fileURLToPath(new URL('.', import.meta.url))

export const DOC_CACHE_FILE: string = join(__dirname, '../data/documentation.cache.json')
export const DESCRIPTIONS_YAML_FILE: string = join(__dirname, '../data/descriptions.yaml')
export const API_SCHEMA_JSON_FILE: string = join(__dirname, '../api-schema.json')
export const API_SCHEMA_DIFF_JSON_FILE: string = join(__dirname, '../diff.json')
export const MTP_SCHEMA_JSON_FILE: string = join(__dirname, '../mtp-schema.json')
export const ERRORS_JSON_FILE: string = join(__dirname, '../raw-errors.json')
export const APP_CONFIG_JSON_FILE: string = join(__dirname, '../app-config.json')

export const CORE_DOMAIN = 'https://core.telegram.org'
export const COREFORK_DOMAIN = 'https://corefork.telegram.org'
export const BLOGFORK_DOMAIN = 'https://blogfork.telegram.org'

export const TDESKTOP_SCHEMA
    = 'https://raw.githubusercontent.com/telegramdesktop/tdesktop/dev/Telegram/SourceFiles/mtproto/scheme/api.tl'
export const TDESKTOP_LAYER
    = 'https://raw.githubusercontent.com/telegramdesktop/tdesktop/dev/Telegram/SourceFiles/mtproto/scheme/layer.tl'
export const TDLIB_SCHEMA = 'https://raw.githubusercontent.com/tdlib/td/master/td/generate/scheme/telegram_api.tl'
export const WEBK_SCHEMA = 'https://raw.githubusercontent.com/morethanwords/tweb/master/src/scripts/in/schema.json'
export const WEBA_SCHEMA = 'https://raw.githubusercontent.com/Ajaxy/telegram-tt/master/src/lib/gramjs/tl/static/api.tl'
export const WEBA_LAYER = 'https://raw.githubusercontent.com/Ajaxy/telegram-tt/master/src/lib/gramjs/tl/AllTLObjects.ts'

export const ESM_PRELUDE = `// This file is auto-generated. Do not edit.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
`
