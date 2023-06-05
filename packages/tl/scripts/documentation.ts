import * as cheerio from 'cheerio'
import { readFile, writeFile } from 'fs/promises'
import jsYaml from 'js-yaml'
import { createInterface } from 'readline'

import {
    camelToPascal,
    PRIMITIVE_TO_TS,
    snakeToCamel,
    splitNameToNamespace,
    TlEntry,
    TlFullSchema,
} from '@mtcute/tl-utils'

import {
    API_SCHEMA_JSON_FILE,
    BLOGFORK_DOMAIN,
    CORE_DOMAIN,
    COREFORK_DOMAIN,
    DESCRIPTIONS_YAML_FILE,
    DOC_CACHE_FILE,
} from './constants'
import { applyDescriptionsYamlFile } from './process-descriptions-yaml'
import { packTlSchema, unpackTlSchema } from './schema'
import { fetchRetry } from './utils'

export interface CachedDocumentationEntry {
    comment?: string
    arguments?: Record<string, string>
    throws?: TlEntry['throws']
    available?: TlEntry['available']
}

export interface CachedDocumentation {
    updated: string
    classes: Record<string, CachedDocumentationEntry>
    methods: Record<string, CachedDocumentationEntry>
    unions: Record<string, string>
}

function normalizeLinks(url: string, el: cheerio.Cheerio<cheerio.Element>): void {
    el.find('a').each((i, _it) => {
        const it = cheerio.default(_it)
        let href = it.attr('href')
        if (!href) return

        if (href[0] === '#') return

        href = new URL(href, url).href
        it.attr('href', href)

        let m

        if (
            (m = href.match(/\/(constructor|method|union)\/([^#?]+)(?:\?|#|$)/))
        ) {
            const [, type, name] = m
            const [ns, n] = splitNameToNamespace(name)

            if (PRIMITIVE_TO_TS[n]) {
                it.replaceWith(PRIMITIVE_TO_TS[n])

                return
            }

            let q = camelToPascal(snakeToCamel(n))

            if (type === 'method' || type === 'constructor') {
                q = 'Raw' + q + (type === 'method' ? 'Request' : '')
            } else {
                q = 'Type' + q
            }

            const fullName = ns ? ns + '.' + q : q

            it.replaceWith(`{@link ${fullName}}`)
        }
    })
}

function extractDescription($: cheerio.CheerioAPI) {
    return $('.page_scheme')
        .prevAll('p')
        .get()
        .reverse()
        .map((el) => $(el).html()?.trim())
        .filter(Boolean)
        .join('\n\n')
        .trim()
}

// from https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json
const PROGRESS_CHARS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

async function chooseDomainForDocs(
    headers: Record<string, string>,
): Promise<[number, string]> {
    let maxLayer = 0
    let maxDomain = ''

    for (const domain of [CORE_DOMAIN, COREFORK_DOMAIN, BLOGFORK_DOMAIN]) {
        const index = await fetchRetry(`${domain}/schema`, { headers })
        const layerMatch = cheerio
            .load(index)('.dev_layer_select .dropdown-toggle')
            .text()
            .match(/layer (\d+)/i)

        if (!layerMatch) {
            throw new Error(`Failed to parse layer from ${domain}`)
        }

        const actualLayer = parseInt(layerMatch[1])

        if (actualLayer > maxLayer) {
            maxLayer = actualLayer
            maxDomain = domain
        }
    }

    return [maxLayer, maxDomain]
}

export async function fetchDocumentation(
    schema: TlFullSchema,
    layer: number,
    silent = !process.stdout.isTTY,
): Promise<CachedDocumentation> {
    const headers = {
        cookie: `stel_dev_layer=${layer}`,
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/87.0.4280.88 Safari/537.36',
    }

    const [actualLayer, domain] = await chooseDomainForDocs(headers)

    console.log('Using domain %s (has layer %s)', domain, actualLayer)

    const ret: CachedDocumentation = {
        updated: `${new Date().toLocaleString(
            'ru-RU',
        )} (layer ${actualLayer}) - from ${domain}`,
        classes: {},
        methods: {},
        unions: {},
    }

    let prevSize = 0
    let logPos = 0

    function log(str: string) {
        if (silent) return
        while (str.length < prevSize) str += ' '

        process.stdout.write('\r' + PROGRESS_CHARS[logPos] + ' ' + str)

        prevSize = str.length
        logPos = (logPos + 1) % PROGRESS_CHARS.length
    }

    for (const entry of schema.entries) {
        log(`📥 ${entry.kind} ${entry.name}`)

        const url = `${domain}/${
            entry.kind === 'class' ? 'constructor' : 'method'
        }/${entry.name}`

        const html = await fetchRetry(url, {
            headers,
        })
        const $ = cheerio.load(html)
        const content = $('#dev_page_content')

        if (content.text().trim() === 'The page has not been saved') continue

        normalizeLinks(url, content)

        const retClass: CachedDocumentationEntry = {}

        const description = extractDescription($)

        if (description) {
            retClass.comment = description
        }

        const parametersTable = $('#parameters').parent().next('table')
        parametersTable.find('tr').each((idx, _el) => {
            const el = $(_el)
            const cols = el.find('td')
            if (!cols.length) return // <thead>

            const name = cols.first().text().trim()
            const description = cols.last().html()?.trim()

            if (description) {
                if (!retClass.arguments) retClass.arguments = {}
                retClass.arguments[name] = description
            }
        })

        if (entry.kind === 'method') {
            const errorsTable = $('#possible-errors').parent().next('table')

            let userBotRequired = false

            errorsTable.find('tr').each((idx, _el) => {
                const el = $(_el)
                const cols = el.find('td')
                if (!cols.length) return // <thead>

                const code = parseInt($(cols[0]).text())
                const name = $(cols[1]).text()
                const comment = $(cols[2]).text()

                if (name === 'USER_BOT_REQUIRED') userBotRequired = true

                if (!retClass.throws) retClass.throws = []
                retClass.throws.push({ code, name, comment })
            })

            const botsCanUse = Boolean($('#bots-can-use-this-method').length)
            const onlyBotsCanUse =
                botsCanUse &&
                (Boolean(description.match(/[,;]( for)? bots only$/)) ||
                    userBotRequired)

            if (onlyBotsCanUse) {
                retClass.available = 'bot'
            } else if (botsCanUse) {
                retClass.available = 'both'
            } else {
                retClass.available = 'user'
            }
        }

        ret[entry.kind === 'class' ? 'classes' : 'methods'][entry.name] =
            retClass
    }

    for (const name in schema.unions) {
        log(`📥 union ${name}`)

        const url = `${domain}/type/${name}`

        const html = await fetchRetry(url, {
            headers,
        })
        const $ = cheerio.load(html)
        const content = $('#dev_page_content')

        if (content.text().trim() === 'The page has not been saved') continue

        normalizeLinks(url, content)

        const description = extractDescription($)
        if (description) ret.unions[name] = description
    }

    log('✨ Patching descriptions')

    const descriptionsYaml = jsYaml.load(
        await readFile(DESCRIPTIONS_YAML_FILE, 'utf8'),
    )
    applyDescriptionsYamlFile(ret, descriptionsYaml)

    log('🔄 Writing to file')

    await writeFile(DOC_CACHE_FILE, JSON.stringify(ret))

    if (!silent) process.stdout.write('\n')

    return ret
}

export function applyDocumentation(
    schema: TlFullSchema,
    docs: CachedDocumentation,
) {
    for (let i = 0; i < 2; i++) {
        const kind = i === 0 ? 'classes' : 'methods'

        const objIndex = schema[kind]
        const docIndex = docs[kind]

        for (const name in docIndex) {
            if (!(name in objIndex)) continue

            const obj = objIndex[name]
            const doc = docIndex[name]

            if (doc.comment) obj.comment = doc.comment
            if (doc.throws) obj.throws = doc.throws
            if (doc.available) obj.available = doc.available

            if (doc.arguments) {
                const args = doc.arguments
                obj.arguments.forEach((arg) => {
                    if (arg.name in args) {
                        arg.comment = args[arg.name]
                    }
                })
            }
        }
    }

    for (const name in schema.unions) {
        if (!(name in docs.unions)) continue

        schema.unions[name].comment = docs.unions[name]
    }
}

export async function getCachedDocumentation(): Promise<CachedDocumentation | null> {
    try {
        const file = await readFile(DOC_CACHE_FILE, 'utf8')

        return JSON.parse(file)
    } catch (e: unknown) {
        if (e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT') {
            return null
        }
        throw e
    }
}

async function main() {
    let cached = await getCachedDocumentation()

    if (cached) {
        console.log('Cached documentation: %d', cached.updated)
    }

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    })
    const input = (q: string): Promise<string> =>
        new Promise((res) => rl.question(q, res))

    while (true) {
        console.log('Choose action:')
        console.log('0. Exit')
        console.log('1. Update documentation')
        console.log('2. Apply descriptions.yaml')
        console.log('3. Apply documentation to schema')

        const act = parseInt(await input('[0-3] > '))

        if (isNaN(act) || act < 0 || act > 3) {
            console.log('Invalid action')
            continue
        }

        if (act === 0) return

        if (act === 1) {
            const [schema, layer] = unpackTlSchema(
                JSON.parse(await readFile(API_SCHEMA_JSON_FILE, 'utf8')),
            )
            cached = await fetchDocumentation(schema, layer)
        }

        if (act === 2) {
            if (!cached) {
                console.log('No schema available, fetch it first')
                continue
            }

            const descriptionsYaml = jsYaml.load(
                await readFile(DESCRIPTIONS_YAML_FILE, 'utf8'),
            )
            applyDescriptionsYamlFile(cached, descriptionsYaml)

            await writeFile(DOC_CACHE_FILE, JSON.stringify(cached))
        }

        if (act === 3) {
            if (!cached) {
                console.log('No schema available, fetch it first')
                continue
            }

            const [schema, layer] = unpackTlSchema(
                JSON.parse(await readFile(API_SCHEMA_JSON_FILE, 'utf8')),
            )

            applyDocumentation(schema, cached)
            await writeFile(
                API_SCHEMA_JSON_FILE,
                JSON.stringify(packTlSchema(schema, layer)),
            )
        }
    }
}

if (require.main === module) {
    main().catch(console.error)
}
