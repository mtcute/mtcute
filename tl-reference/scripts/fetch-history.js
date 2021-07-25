const fs = require('fs')
const path = require('path')
const { convertTlToJson } = require('../../packages/tl/scripts/generate-schema')
const fetch = require('node-fetch')
const qs = require('querystring')
const { convertToArrays } = require('./prepare-data')

const UNIX_0 = '1970-01-01T00:00:00Z'
const CURRENT_FILE = 'Telegram/Resources/tl/api.tl'
const FILES = [
    'Telegram/SourceFiles/mtproto/scheme.tl',
    'Telegram/Resources/scheme.tl',
    CURRENT_FILE,
]

async function getLastFetched() {
    return fs.promises
        .readFile(
            path.join(__dirname, '../data/history/last-fetched.txt'),
            'utf8'
        )
        .then((res) => JSON.parse(res))
        .catch(() =>
            FILES.reduce((a, b) => {
                a[b] = UNIX_0
                return a
            }, {})
        )
}

async function updateLastFetched(file, time) {
    return getLastFetched().then((state) =>
        fs.promises.writeFile(
            path.join(__dirname, '../data/history/last-fetched.txt'),
            JSON.stringify({
                ...state,
                [file]: time,
            })
        )
    )
}

async function getCounts() {
    return fs.promises
        .readFile(path.join(__dirname, '../data/history/counts.txt'), 'utf8')
        .then((res) => JSON.parse(res))
        .catch(() => ({}))
}

async function setCounts(obj) {
    return fs.promises.writeFile(
        path.join(__dirname, '../data/history/counts.txt'),
        JSON.stringify(obj)
    )
}

async function getFileContent(file, commit) {
    return fetch(
        `https://raw.githubusercontent.com/telegramdesktop/tdesktop/${commit}/${file}`
    ).then((r) => r.text())
}

async function parseRemoteTl(file, commit) {
    let content = await getFileContent(file, commit)
    if (content === '404: Not Found') return null

    let layer = (function () {
        const m = content.match(/^\/\/ LAYER (\d+)/m)
        if (m) return m[1]
        return null
    })()
    if (!layer) {
        // older files did not contain layer number in comment.
        if (content.match(/invokeWithLayer#da9b0d0d/)) {
            // if this is present, then the layer number is available in
            // Telegram/SourceFiles/mtproto/mtpCoreTypes.h
            let mtpCoreTypes = await getFileContent(
                'Telegram/SourceFiles/mtproto/mtpCoreTypes.h',
                commit
            )
            if (mtpCoreTypes === '404: Not Found') {
                mtpCoreTypes = await getFileContent(
                    'Telegram/SourceFiles/mtproto/core_types.h',
                    commit
                )
            }
            const m = mtpCoreTypes.match(
                /^static const mtpPrime mtpCurrentLayer = (\d+);$/m
            )
            if (!m)
                throw new Error(
                    `Could not determine layer number for file ${file} at commit ${commit}`
                )
            layer = m[1]
        } else {
            // even older files on ancient layers
            // layer number is the largest available invokeWithLayerN constructor
            let max = 0
            content.replace(/invokeWithLayer(\d+)#[0-f]+/g, (_, $1) => {
                $1 = parseInt($1)
                if ($1 > max) max = $1
            })
            if (max === 0)
                throw new Error(
                    `Could not determine layer number for file ${file} at commit ${commit}`
                )
            layer = max + ''
        }
    }

    if (content.match(/bad_server_salt#/)) {
        // this is an older file that contained both mtproto and api
        // since we are only interested in api, remove the mtproto part
        const lines = content.split('\n')
        const apiIdx = lines.indexOf('///////// Main application API')
        if (apiIdx === -1)
            throw new Error('Could not find split point for combined file')
        content = lines.slice(apiIdx).join('\n')
    }

    return {
        layer,
        content,
        tl: convertToArrays(await convertTlToJson(content, 'api', true)),
    }
}

function fileSafeDateFormat(date) {
    date = new Date(date)
    return date
        .toISOString()
        .replace(/[\-:]|\.\d\d\d/g, '')
        .split('T')[0]
}

function shortSha(sha) {
    return sha.substr(0, 7)
}

async function fetchHistory(file, since, counts, defaultPrev = null, defaultPrevFile = null) {
    const history = await (async function () {
        const ret = []
        let page = 1
        while (true) {
            const chunk = await fetch(
                `https://api.github.com/repos/telegramdesktop/tdesktop/commits?` +
                    qs.stringify({
                        since,
                        path: file,
                        per_page: 100,
                        page,
                    })
            ).then((r) => r.json())

            if (!chunk.length) break

            ret.push(...chunk)
            page += 1
        }

        return ret
    })()

    // should not happen
    if (history.length === 0) throw new Error('history is empty')

    const filename = (schema, commit) =>
        `layer${schema.layer}-${fileSafeDateFormat(
            commit.commit.committer.date
        )}-${shortSha(commit.sha)}.json`

    const uid = (schema, commit) => `${schema.layer}_${shortSha(commit.sha)}`

    function writeSchemaToFile(schema, commit) {
        return fs.promises.writeFile(
            path.join(__dirname, `../data/history/${filename(schema, commit)}`),
            JSON.stringify({
                // layer is ever-incrementing, sha is random, so no collisions
                uid: uid(schema, commit),
                tl: JSON.stringify(schema.tl),
                layer: parseInt(schema.layer),
                rev:
                    schema.layer in counts
                        ? ++counts[schema.layer]
                        : (counts[schema.layer] = 0),
                content: schema.content,
                prev: schema.prev ? schema.prev : defaultPrev,
                prevFile: schema.prevFile ? schema.prevFile : defaultPrevFile,
                source: {
                    file,
                    date: commit.commit.committer.date,
                    commit: commit.sha,
                    message: commit.message,
                },
            })
        )
    }

    let base = history.pop()
    let baseSchema = await parseRemoteTl(file, base.sha)
    let baseFilename = () => filename(baseSchema, base)

    try {
        await fs.promises.access(
            path.join(__dirname, `../data/history/${baseFilename()}`),
            fs.F_OK
        )
    } catch (e) {
        await writeSchemaToFile(baseSchema, base)
    }

    while (history.length) {
        const next = history.pop()
        const nextSchema = await parseRemoteTl(file, next.sha)
        if (!nextSchema) break

        nextSchema.prev = uid(baseSchema, base)
        nextSchema.prevFile = baseFilename()
        base = next
        baseSchema = nextSchema
        await updateLastFetched(file, base.commit.committer.date)
        await setCounts(counts)
        await writeSchemaToFile(baseSchema, base)
        console.log(
            'Fetched commit %s, file %s (%s)',
            shortSha(base.sha),
            file,
            base.commit.committer.date
        )
    }

    if (file !== CURRENT_FILE) {
        await updateLastFetched(file, `DONE:${uid(baseSchema, base)}:${baseFilename()}`)
    }

    console.log('No more commits for %s', file)
}

async function main() {
    let last = await getLastFetched()
    const counts = await getCounts()

    for (let i = 0; i < FILES.length; i++) {
        const file = FILES[i]
        const prev = FILES[i - 1]
        if (!last[file].startsWith('DONE')) {
            let parent = prev ? last[prev].split(':')[1] : null
            let parentFile = prev ? last[prev].split(':')[2] : null

            await fetchHistory(file, last[file], counts, parent, parentFile)

            last = await getLastFetched()
        }
    }

    console.log('Creating reverse links ("next" field)')
    for (const file of await fs.promises.readdir(
        path.join(__dirname, '../data/history')
    )) {
        if (!file.startsWith('layer')) continue

        const fullPath = path.join(__dirname, '../data/history', file)
        const json = JSON.parse(await fs.promises.readFile(fullPath, 'utf-8'))
        if (json.prev) {
            const parentPath = path.join(
                __dirname,
                '../data/history',
                json.prevFile
            )
            const parentJson = JSON.parse(
                await fs.promises.readFile(parentPath, 'utf-8')
            )
            parentJson.next = json.uid
            await fs.promises.writeFile(parentPath, JSON.stringify(parentJson))
        }
    }
}

main().catch(console.error)
