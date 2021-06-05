// Downloads latest .tl schemas from TDesktop repo,
// fetches documentation from https://core.telegram.org/schema
// and builds a single .json file from all of that,
// while also changing default types (they suck) to ts-like
// disclaimer: code sucks because tl itself sucks :shrug:

const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const { applyDescriptionsFile } = require('./process-descriptions-yaml')
const yaml = require('js-yaml')
const { snakeToCamel } = require('./common')
const { asyncPool } = require('eager-async-pool')
const SingleRegex = /^(.+?)(?:#([0-f]{1,8}))?(?: \?)?(?: {(.+?:.+?)})? ((?:.+? )*)= (.+);$/

const transformIgnoreNamespace = (fn, s) => {
    if (s.includes('.')) {
        let [namespace, name] = s.split('.')
        return namespace + '.' + fn(name)
    }
    return fn(s)
}
const normalizeGenerics = (s) => {
    if (!s.includes(' ')) return s

    let [base, ...args] = s.split(' ')
    let ret = base
    let depth = 0
    args.forEach((arg) => {
        depth += 1
        ret += '<' + arg
    })
    while (depth--) ret += '>'
    return ret
}

// all result types must be different to allow differentiating wire format
// (we could make int128 = Buffer, int256 = Buffer, but we would have no way to determine which is which after building json)
const _types = {
    int: 'number',
    long: 'Long',
    int128: 'Int128',
    int256: 'Int256',
    double: 'Double',
    string: 'string',
    bytes: 'Buffer',
    boolFalse: 'false',
    boolTrue: 'true',
    bool: 'boolean',
    Bool: 'boolean',
    true: 'true',
    null: 'null',
    Type: 'any',
    // this will be removed by generate-reader/writer script and replaced with flags calculation
    '#': '$FlagsBitField',
}

// override Long to RawLong type for some mtproto types
const overrideLongToRawLong = Object.entries({
    mt_bind_auth_key_inner: [
        'nonce',
        'temp_auth_key_id',
        'perm_auth_key_id',
        'temp_session_id',
    ],
    mt_bad_server_salt: ['new_server_salt'],
    mt_future_salt: ['salt'],
    mt_destroy_session_ok: ['session_id'],
    mt_destroy_session_none: ['session_id'],
    mt_destroy_session: ['session_id'],
    mt_new_session_created: ['server_salt'],
}).flatMap(([obj, args]) => args.map((it) => `${obj}#${it}`))

function getJSType(typ, argName) {
    if (typ[0] === '!') typ = typ.substr(1)
    if (typ === 'long' && overrideLongToRawLong.includes(argName))
        return 'RawLong'
    if (typ in _types) return _types[typ]
    let m = typ.match(/^[Vv]ector[< ](.+?)[> ]$/)
    if (m) {
        return getJSType(m[1], argName) + '[]'
    }
    return normalizeGenerics(typ)
}

function convertTlToJson(tlText, tlType, silent = false) {
    let lines = tlText.split('\n')
    let pos = 0
    let line = lines[0].trim()

    const padSize = (lines.length + '').length
    const pad = (i) => {
        const len = (i + '').length
        if (len < padSize) {
            let pre = ''
            for (let i = 0; i < padSize - len; i++) {
                pre += ' '
            }
            return pre + i
        } else return i
    }

    const state = {
        comment: '',
        annotations: null,
        type: 'class',
        extends: null,
        blankLines: 0,
        stop: false,
    }

    const unions = {}

    let nextLine = () => {
        state.stop = pos === lines.length - 1
        if (state.stop) return

        line = lines[++pos].trim()
        if (line === '') {
            state.blankLines++
        } else {
            state.blankLines = 0
        }
        if (line && line.startsWith('---functions---')) {
            state.type = 'method'
            return nextLine()
        }
        if (line && line.startsWith('---types---')) {
            state.type = 'class'
            return nextLine()
        }
        if (!silent) process.stdout.write(
            `[${pad(pos)}/${lines.length}] Processing ${tlType}.tl..\r`
        )
    }

    const ret = {}

    function getNamespace(name) {
        if (!ret[name]) {
            ret[name] = {
                classes: [],
                methods: [],
                unions: [],
            }
        }
        return ret[name]
    }

    if (!silent) process.stdout.write(
        `[${pad(pos)}/${lines.length}] Processing ${tlType}.tl..\r`
    )

    while (!state.stop) {
        if (line === '' || line.startsWith('//')) {
            // skip empty lines and comments
            nextLine()
            continue
        }

        const match = SingleRegex.exec(line)
        if (!match) {
            console.warn('Regex failed on:\n"' + line + '"')
        } else {
            let [, fullName, typeId = '0', generics, args, type] = match
            if (fullName in _types || fullName === 'vector') {
                // vector is parsed manually
                nextLine()
                continue
            }

            args = args.trim()
            args =
                args && !args.match(/\[ [a-z]+ ]/i)
                    ? args.split(' ').map((j) => j.split(':'))
                    : []

            if (state.type === 'class') {
                let [namespace, name] = fullName.split('.')
                if (!name) {
                    name = namespace
                    namespace = '$root'
                }

                if (!unions[type]) unions[type] = []
                unions[type].push(
                    namespace === '$root' ? name : namespace + '.' + name
                )

                let r = {
                    name,
                    id: parseInt(typeId, 16),
                    type: getJSType(type),
                    arguments: [],
                }
                if (generics) {
                    r.generics = generics.split(',').map((it) => {
                        let [name, superClass] = it.split(':')
                        return { name, super: getJSType(superClass) }
                    })
                }
                if (args.length) {
                    r.arguments = args.map(([name, typ]) => {
                        let [predicate, type] = typ.split('?')
                        if (!type) {
                            return {
                                name: snakeToCamel(name),
                                type: getJSType(
                                    typ,
                                    tlType === 'mtproto'
                                        ? `mt_${fullName}#${name}`
                                        : ''
                                ),
                            }
                        }
                        return {
                            name: snakeToCamel(name),
                            type: getJSType(
                                type,
                                tlType === 'mtproto'
                                    ? `mt_${fullName}#${name}`
                                    : ''
                            ),
                            optional: true,
                            predicate,
                        }
                    })
                }

                getNamespace(namespace).classes.push(r)
            } else {
                let [namespace, name] = fullName.split('.')
                if (!name) {
                    name = namespace
                    namespace = '$root'
                }

                let r = {
                    name: snakeToCamel(name),
                    id: parseInt(typeId, 16),
                    returns: getJSType(type),
                    arguments: [],
                }
                if (generics) {
                    r.generics = generics.split(',').map((it) => {
                        let [name, superClass] = it.split(':')
                        return { name, super: getJSType(superClass) }
                    })
                }
                if (args.length) {
                    r.arguments = args.map(([name, typ]) => {
                        let [predicate, type] = typ.split('?')
                        if (!type) {
                            return {
                                name: snakeToCamel(name),
                                type: getJSType(
                                    typ,
                                    tlType === 'mtproto'
                                        ? `mt_${fullName}#${name}`
                                        : ''
                                ),
                            }
                        }
                        return {
                            name: snakeToCamel(name),
                            type: getJSType(
                                type,
                                tlType === 'mtproto'
                                    ? `mt_${fullName}#${name}`
                                    : ''
                            ),
                            optional: true,
                            predicate,
                        }
                    })
                }
                getNamespace(namespace).methods.push(r)
            }
        }
        nextLine()
    }

    Object.entries(unions).forEach(([type, subtypes]) => {
        let [namespace, name] = type.split('.')
        if (!name) {
            name = namespace
            namespace = '$root'
        }

        getNamespace(namespace).unions.push({
            type: name,
            subtypes,
        })
    })

    if (!silent) console.log(`[${lines.length}/${lines.length}] Processed ${tlType}.tl`)

    return ret
}

async function addDocumentation(obj) {
    console.log('[i] Parsing documentation entries')
    // structure: { type: 'class' | 'method' | 'type', name: string, target: object }
    let tasks = []

    Object.entries(obj).forEach(([namespace, content]) => {
        if (namespace === '$root') namespace = ''
        else namespace += '.'
        content.classes.forEach((cls) =>
            tasks.push({
                type: 'class',
                name: namespace + cls.name,
                target: cls,
            })
        )
        content.methods.forEach((cls) =>
            tasks.push({
                type: 'method',
                name: namespace + cls.name,
                target: cls,
            })
        )
        content.unions.forEach((cls) =>
            tasks.push({
                type: 'union',
                name: namespace + cls.type,
                target: cls,
            })
        )
    })

    async function parseDocumentation(task) {
        const { type, name, target } = task
        let path = {
            class: 'constructor',
            method: 'method',
            union: 'type',
        }[type]

        const url = `https://core.telegram.org/${path}/${name}`

        function normalizeLinks(el) {
            el.find('a').each((i, it) => {
                it = $(it)
                it.attr('href', new URL(it.attr('href'), url).href)
                let href = it.attr('href')
                let m
                if (
                    (m = href.match(
                        /\/(constructor|method|union)\/([^#?]+)(?:\?|#|$)/
                    ))
                ) {
                    let [, type, name] = m
                    if (type === 'method')
                        name = transformIgnoreNamespace(snakeToCamel, name)
                    it.replaceWith(`{@link ${name}}`)
                }
            })
        }

        let html = await fetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
                    'Chrome/87.0.4280.88 Safari/537.36',
            },
        }).then((i) => i.text())
        let $ = cheerio.load(html)
        normalizeLinks($('#dev_page_content'))

        if ($('#dev_page_content').text().includes('has not been saved')) return

        target.description = $('#dev_page_content')
            .find('p')
            .first()
            .html()
            .trim()
        let parametersTable = $("h3:contains('Parameters')").next()
        parametersTable.find('tr').each((idx, el) => {
            el = $(el)
            let cols = el.find('td')
            if (!cols.length) return // <thead>
            let name = snakeToCamel(cols.first().text().trim())
            let description = cols.last().html().trim()

            target.arguments.forEach((arg) => {
                if (arg.name === name) arg.description = description
            })
        })

        if (type === 'method') {
            let errorsTable = $("h3:contains('Possible errors')").next()
            errorsTable.find('tr').each((idx, el) => {
                el = $(el)
                let cols = el.find('td')
                if (!cols.length) return // <thead>
                let code = parseInt($(cols[0]).text())
                let name = $(cols[1]).text()
                let description = $(cols[2]).text()

                if (!target.throws) target.throws = []
                target.throws.push({ code, name, description })
            })

            let botsCanUse = !!$("h3:contains('Bots can use this method')")
                .length
            let onlyBotsCanUse =
                botsCanUse && (
                    !!target.description.match(/[,;]( for)? bots only$/)
                    || (target.throws && target.throws.some((it) => it.code === 'USER_BOT_REQUIRED'))
                )

            target.available = onlyBotsCanUse
                ? 'bot'
                : botsCanUse
                ? 'both'
                : 'user'
        }
    }

    let count = 0
    for await (let { idx, error } of asyncPool(parseDocumentation, tasks, {
        limit: 5,
    })) {
        if (error) {
            if (error instanceof fetch.FetchError) {
                console.error(
                    'Network error %s while downloading docs for %s %s, retrying',
                    error.message,
                    tasks[idx].type,
                    tasks[idx].name
                )
                tasks.push(tasks[idx])
            } else {
                console.error(
                    'Error while downloading docs for %o: %s',
                    tasks[idx],
                    error
                )
            }
        }
        if (++count % 50 === 0)
            process.stdout.write(`Downloading documentation: ${count} so far\r`)
    }
}

// converts telegram's json to tl
function convertJsonToTl(json) {
    // their json schema uses signed integers for ids, we use unsigned, so we need to convert them
    const signedInt32ToUnsigned = (val) => (val < 0 ? val + 0x100000000 : val)

    const lines = []
    const objectToLine = (cls) => {
        let line = `${cls.predicate || cls.method}#${signedInt32ToUnsigned(
            parseInt(cls.id)
        ).toString(16)}${cls.params
            .map((p) => ` ${p.name}:${p.type}`)
            .join('')} = ${cls.type};`
        lines.push(line)
    }

    // i honestly have no idea why http_wait is a function in schema.
    // it can't be a function.
    // there's literally no way.
    // and it is a type in tgdesktop schema.
    // (see https://t.me/teispam/998, in russian)
    // durov why
    let httpWait = json.methods.find((it) => it.method === 'http_wait')
    json.methods = json.methods.filter((it) => it.method !== 'http_wait')
    json.constructors.push(httpWait)

    json.constructors.filter(Boolean).forEach(objectToLine)
    lines.push('---functions---')
    json.methods.filter(Boolean).forEach(objectToLine)
    return lines.join('\n')
}

async function main() {
    const descriptionsYaml = yaml.load(
        await fs.promises.readFile(path.join(__dirname, '../descriptions.yaml'))
    )

    console.log('[i] Fetching mtproto.tl')
    // using this instead of one in tgdesktop repo because tgdesktop one uses strings instead of bytes in many places
    // idk why, i don't wanna know why, maybe some memes with strings in c++ or smth...
    // seems like in api.tl there's no such thing (hopefully?)
    //
    // and also tl-schema inside the docs is outdated, unlike json (wtf???)
    // so we basically convert their json to tl, just to convert it back to json immediately after that
    // thank you durov
    let mtprotoTl = await fetch('https://core.telegram.org/schema/mtproto-json')
        .then((i) => i.json())
        .then((json) => convertJsonToTl(json))
    let ret = {}

    ret.mtproto = convertTlToJson(mtprotoTl, 'mtproto')

    console.log('[i] Fetching api.tl')
    let apiTl = await fetch(
        'https://raw.githubusercontent.com/telegramdesktop/tdesktop/dev/Telegram/Resources/tl/api.tl'
    ).then((i) => i.text())
    ret.apiLayer = apiTl.match(/^\/\/ LAYER (\d+)/m)[1]
    ret.api = convertTlToJson(apiTl, 'api')
    await addDocumentation(ret.api)

    await applyDescriptionsFile(ret, descriptionsYaml)

    await fs.promises.writeFile(
        path.join(__dirname, '../raw-schema.json'),
        JSON.stringify(ret, 4)
    )

    // update version in README.md
    let readmeMd = await fs.promises.readFile(
        path.join(__dirname, '../README.md'),
        'utf-8'
    )
    readmeMd = readmeMd.replace(
        /^Generated from TL layer \*\*\d+\*\* \(last updated on \d+\.\d+\.\d+\)\.$/m,
        `Generated from TL layer **${
            ret.apiLayer
        }** (last updated on ${new Date().toLocaleDateString('ru')}).`
    )
    await fs.promises.writeFile(path.join(__dirname, '../README.md'), readmeMd)
}

module.exports = {
    convertTlToJson,
    convertJsonToTl
}

if (require.main === module) {
    main().catch(console.error)
}
