import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

import * as cheerio from 'cheerio'
import { asyncPool } from '@fuman/utils'
import jsYaml from 'js-yaml'
import type {
    TlEntry,
    TlFullSchema,
} from '@mtcute/tl-utils'
import {
    PRIMITIVE_TO_TS,
    camelToPascal,
    jsComment,
    snakeToCamel,
    splitNameToNamespace,
} from '@mtcute/tl-utils'

import {
    API_SCHEMA_JSON_FILE,
    APP_CONFIG_JSON_FILE,
    BLOGFORK_DOMAIN,
    COREFORK_DOMAIN,
    CORE_DOMAIN,
    DESCRIPTIONS_YAML_FILE,
    DOC_CACHE_FILE,
} from './constants.js'
import { applyDescriptionsYamlFile } from './process-descriptions-yaml.js'
import type { TlPackedSchema } from './schema.js'
import { packTlSchema, unpackTlSchema } from './schema.js'
import { fetchRetry } from './utils.js'

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

        if ((m = href.match(/\/(constructor|method|union)\/([^#?]+)(?:\?|#|$)/))) {
            const [, type, name] = m
            const [ns, n] = splitNameToNamespace(name)

            if (PRIMITIVE_TO_TS[n]) {
                it.replaceWith(PRIMITIVE_TO_TS[n])

                return
            }

            let q = camelToPascal(snakeToCamel(n))

            if (type === 'method' || type === 'constructor') {
                q = `Raw${q}${type === 'method' ? 'Request' : ''}`
            } else {
                q = `Type${q}`
            }

            const fullName = ns ? `${ns}.${q}` : q

            it.replaceWith(`{@link ${fullName}}`)
        }
    })
}

function unescapeHtml(text: string) {
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .trim()
}

function extractDescription($: cheerio.CheerioAPI) {
    return $('.page_scheme')
        .prevAll('p')
        .get()
        .reverse()
        .map(el => $(el).html()?.trim())
        .filter(Boolean)
        .join('\n\n')
        .trim()
}

function htmlAll($: cheerio.CheerioAPI, search: cheerio.Cheerio<cheerio.Element>) {
    return search
        .get()
        .map(el => $(el).html() ?? '')
        .join('')
}

// from https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json
const PROGRESS_CHARS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

async function chooseDomainForDocs(headers: Record<string, string>): Promise<[number, string]> {
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

        const actualLayer = Number.parseInt(layerMatch[1])

        if (actualLayer > maxLayer) {
            maxLayer = actualLayer
            maxDomain = domain
        }
    }

    return [maxLayer, maxDomain]
}

function lastParensGroup(text: string): string | undefined {
    const groups = []
    let depth = 0
    let current = ''

    for (let i = 0; i < text.length; i++) {
        if (text[i] === ')') depth--

        if (depth > 0) {
            current += text[i]
        }

        if (text[i] === '(') depth++

        if (current && depth === 0) {
            groups.push(current)
            current = ''
        }
    }

    return groups[groups.length - 1]
}

async function fetchAppConfigDocumentation() {
    const headers = {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
            + 'Chrome/87.0.4280.88 Safari/537.36',
    }

    const [, domain] = await chooseDomainForDocs(headers)

    const page = await fetchRetry(`${domain}/api/config`, { headers })
    const $ = cheerio.load(page)

    const fields = $('p:icontains(typical fields included)').nextUntil('h3')
    normalizeLinks(`${domain}/api/config`, fields)
    const fieldNames = fields.filter('h4')

    const _example = $('p:icontains(example value)').next('pre').find('code')
    const example = JSON.parse(_example.text().trim()) as Record<string, unknown>

    const result: Record<string, unknown> = {}

    function valueToTypescript(value: unknown, record = false): string {
        if (value === undefined) return 'unknown'
        if (value === null) return 'null'

        if (Array.isArray(value)) {
            const types = new Set(value.map(v => typeof v))

            if (types.size === 1) {
                return `${valueToTypescript(value[0])}[]`
            }

            return `(${value.map(v => valueToTypescript(v)).join(' | ')})[]`
        }

        if (typeof value === 'object') {
            if (record) {
                const inner = Object.values(value)[0] as unknown

                return `Record<string, ${valueToTypescript(inner)}>`
            }

            return (
                `{\n${
                Object.entries(value)
                    .map(([k, v]) => `    ${k}: ${valueToTypescript(v)}`)
                    .join('\n')
                }\n}`
            )
        }

        return typeof value
    }

    function docsTypeToTypescript(field: string, type: string): string {
        let m

        if ((m = type.match(/(.*), defaults to .+$/i))) {
            return docsTypeToTypescript(field, m[1])
        }

        if ((m = type.match(/^array of (.+?)s?$/i))) {
            return `${docsTypeToTypescript(field, m[1])}[]`
        }

        switch (type) {
            case 'integer':
                return 'number'
            case 'itneger':
                return 'number'
            case 'float':
                return 'number'
            case 'string':
                return 'string'
            case 'string emoji':
                return 'string'
            case 'boolean':
                return 'boolean'
            case 'bool':
                return 'boolean'
        }

        if (type.match(/^object with .+? keys|^map of/i)) {
            return valueToTypescript(example[field], true)
        }

        if (type.match(/^strings?, /)) {
            if (type.includes('or')) {
                const options = type.slice(8).split(/, | or /)

                return options.map(o => (o[0] === '"' ? o : JSON.stringify(o))).join(' | ')
            }

            return 'string'
        }

        if (type.includes(',')) {
            return docsTypeToTypescript(field, type.split(',')[0])
        }

        if (type.match(/^numeric string/)) {
            return 'string'
        }

        if (type.includes('as described')) {
            return valueToTypescript(example[field])
        }

        console.log(`Failed to parse type at ${field}: ${type}`)

        return valueToTypescript(example[field])
    }

    for (const fieldName of fieldNames.toArray()) {
        const name = $(fieldName).text().trim()
        const description = htmlAll($, $(fieldName).nextUntil('h3, h4'))
        let type = 'unknown'

        let typeStr = lastParensGroup(description)

        if (!typeStr) {
            typeStr = description.match(/\s+\((.+?)(?:\)|\.|\)\.)$/)?.[1]
        }

        if (typeStr) {
            type = docsTypeToTypescript(name, typeStr)
        } else if (name in example) {
            type = valueToTypescript(example[name])
        }

        result[name] = {
            type,
            description: jsComment(description),
        }
    }

    return result
}

export async function fetchDocumentation(
    schema: TlFullSchema,
    layer: number,
    silent: boolean = !process.stdout.isTTY,
): Promise<CachedDocumentation> {
    const headers = {
        'cookie': `stel_dev_layer=${layer}`,
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
            + 'Chrome/87.0.4280.88 Safari/537.36',
    }

    const [actualLayer, domain] = await chooseDomainForDocs(headers)

    console.log('Using domain %s (has layer %s)', domain, actualLayer)

    const ret: CachedDocumentation = {
        updated: `${new Date().toLocaleString('ru-RU')} (layer ${actualLayer}) - from ${domain}`,
        classes: {},
        methods: {},
        unions: {},
    }

    let prevSize = 0
    let logPos = 0

    function log(str: string) {
        if (silent) return
        const oldPrevSize = prevSize
        prevSize = str.length
        while (str.length < oldPrevSize) str += ' '

        process.stdout.write(`\r${PROGRESS_CHARS[logPos]} ${str}`)

        logPos = (logPos + 1) % PROGRESS_CHARS.length
    }

    async function fetchDocsForEntry(entry: TlEntry) {
        const url = `${domain}/${entry.kind === 'class' ? 'constructor' : 'method'}/${entry.name}`

        const html = await fetchRetry(url, {
            headers,
        })
        const $ = cheerio.load(html)
        const content = $('#dev_page_content')

        if (content.text().trim() === 'The page has not been saved') return

        normalizeLinks(url, content)

        const retClass: CachedDocumentationEntry = {}

        const description = unescapeHtml(extractDescription($))

        if (description) {
            retClass.comment = description
        }

        const parametersTable = $('#parameters').parent().next('table')
        parametersTable.find('tr').each((idx, _el) => {
            const el = $(_el)
            const cols = el.find('td')
            if (!cols.length) return // <thead>

            const name = cols.first().text().trim()
            const description = unescapeHtml(cols.last().html() ?? '')

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

                const code = Number.parseInt($(cols[0]).text())
                const name = $(cols[1]).text()
                const comment = $(cols[2]).text()

                if (name === 'USER_BOT_REQUIRED') userBotRequired = true

                if (!retClass.throws) retClass.throws = []
                retClass.throws.push({ code, name, comment })
            })

            const botsCanUse = Boolean($('#bots-can-use-this-method').length)
            const onlyBotsCanUse
                = botsCanUse && (Boolean(description.match(/[,;]( for)? bots only$/)) || userBotRequired)

            if (onlyBotsCanUse) {
                retClass.available = 'bot'
            } else if (botsCanUse) {
                retClass.available = 'both'
            } else {
                retClass.available = 'user'
            }
        }

        ret[entry.kind === 'class' ? 'classes' : 'methods'][entry.name] = retClass

        log(`📥 ${entry.kind} ${entry.name}`)
    }

    async function fetchDocsForUnion(name: string) {
        log(`📥 union ${name}`)

        const url = `${domain}/type/${name}`

        const html = await fetchRetry(url, {
            headers,
        })
        const $ = cheerio.load(html)
        const content = $('#dev_page_content')

        if (content.text().trim() === 'The page has not been saved') return

        normalizeLinks(url, content)

        const description = extractDescription($)
        if (description) ret.unions[name] = description

        log(`📥 union ${name}`)
    }

    await asyncPool(
        schema.entries,
        fetchDocsForEntry,
        {
            limit: 16,
            onError: (item, error) => {
                console.log(`❌ ${item.kind} ${item.name} (${error})`)
                return 'throw'
            },
        },
    )

    await asyncPool(
        Object.keys(schema.unions),
        fetchDocsForUnion,
        {
            limit: 16,
            onError: (item, error) => {
                console.log(`❌ union ${item} (${error})`)
                return 'throw'
            },
        },
    )

    log('✨ Patching descriptions')

    const descriptionsYaml = jsYaml.load(await readFile(DESCRIPTIONS_YAML_FILE, 'utf8'))
    applyDescriptionsYamlFile(ret, descriptionsYaml)

    log('🔄 Writing to file')

    await writeFile(DOC_CACHE_FILE, JSON.stringify(ret))

    if (!silent) process.stdout.write('\n')

    return ret
}

export function applyDocumentation(schema: TlFullSchema, docs: CachedDocumentation): void {
    for (let i = 0; i < 2; i++) {
        const kind = i === 0 ? 'classes' : 'methods'

        const objIndex = schema[kind]
        const docIndex = docs[kind]

        for (const name in docIndex) {
            if (!(name in objIndex)) continue

            const obj = objIndex[name]
            const doc = docIndex[name]

            obj.comment = doc.comment
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

        return JSON.parse(file) as CachedDocumentation
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
        console.log('Cached documentation: %s', cached.updated)
    }

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    })
    const input = (q: string): Promise<string> => new Promise(res => rl.question(q, res))

    while (true) {
        console.log('Choose action:')
        console.log('0. Exit')
        console.log('1. Update documentation')
        console.log('2. Apply descriptions.yaml')
        console.log('3. Apply documentation to schema')
        console.log('4. Fetch app config documentation')

        const act = Number.parseInt(await input('[0-4] > '))

        if (Number.isNaN(act) || act < 0 || act > 4) {
            console.log('Invalid action')
            continue
        }

        if (act === 0) {
            rl.close()

            return
        }

        if (act === 1) {
            const [schema, layer] = unpackTlSchema(
                JSON.parse(await readFile(API_SCHEMA_JSON_FILE, 'utf8')) as TlPackedSchema,
            )
            cached = await fetchDocumentation(schema, layer)
        }

        if (act === 2) {
            if (!cached) {
                console.log('No schema available, fetch it first')
                continue
            }

            const descriptionsYaml = jsYaml.load(await readFile(DESCRIPTIONS_YAML_FILE, 'utf8'))
            applyDescriptionsYamlFile(cached, descriptionsYaml)

            await writeFile(DOC_CACHE_FILE, JSON.stringify(cached))
        }

        if (act === 3) {
            if (!cached) {
                console.log('No schema available, fetch it first')
                continue
            }

            const [schema, layer] = unpackTlSchema(
                JSON.parse(await readFile(API_SCHEMA_JSON_FILE, 'utf8')) as TlPackedSchema,
            )

            applyDocumentation(schema, cached)
            await writeFile(API_SCHEMA_JSON_FILE, JSON.stringify(packTlSchema(schema, layer)))
        }

        if (act === 4) {
            const appConfig = await fetchAppConfigDocumentation()

            console.log('Fetched app config documentation')
            await writeFile(APP_CONFIG_JSON_FILE, JSON.stringify(appConfig))
        }
    }
}

if (import.meta.url.startsWith('file:')) {
    const modulePath = fileURLToPath(import.meta.url)

    if (process.argv[1] === modulePath) {
        main().catch((err) => {
            console.error(err)
            process.exit(1)
        })
    }
}
