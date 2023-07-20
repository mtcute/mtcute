// Downloads latest MTProto .tl schema

import * as cheerio from 'cheerio'
import { writeFile } from 'fs/promises'

import { parseTlToEntries } from '@mtcute/tl-utils'

import { CORE_DOMAIN, MTP_SCHEMA_JSON_FILE } from './constants'
import { fetchRetry } from './utils'

async function fetchMtprotoSchema(): Promise<string> {
    const html = await fetchRetry(`${CORE_DOMAIN}/schema/mtproto`)
    const $ = cheerio.load(html)

    // cheerio doesn't always unescape them
    return $('#dev_page_content pre code')
        .text()
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
}

async function main() {
    console.log('Downloading MTProto schema...')
    const schema = await fetchMtprotoSchema()

    console.log('Parsing...')
    let entries = parseTlToEntries(schema, { prefix: 'mt_' })

    // remove manually parsed types
    entries = entries.filter(
        (it) =>
            [
                'mt_msg_container',
                'mt_message',
                'mt_msg_copy',
                'mt_gzip_packed',
                'mt_rpc_result',
            ].indexOf(it.name) === -1,
    )

    // mtproto is handled internally, for simplicity we make them all classes
    entries.forEach((entry) => {
        entry.kind = 'class'
    })

    console.log('Writing to file...')
    await writeFile(MTP_SCHEMA_JSON_FILE, JSON.stringify(entries))

    console.log('Done!')
}

main().catch(console.error)
