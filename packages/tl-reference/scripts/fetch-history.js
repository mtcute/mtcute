const fs = require('fs')
const path = require('path')
const { convertTlToJson } = require('../../tl/scripts/generate-schema')
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
        .readFile(path.join(__dirname, '../data/history/last-fetched.json'), 'utf8')
        .then((res) => JSON.parse(res))
        .catch(() => ({
            ...FILES.reduce((a, b) => {
                a[b] = UNIX_0
                return a
            }, {}),
        }))
}

async function updateLastFetched(file, time) {
    return getLastFetched().then((state) =>
        fs.promises.writeFile(
            path.join(__dirname, '../data/history/last-fetched.json'),
            JSON.stringify({
                ...state,
                [file]: time,
            })
        )
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
        tl: await convertTlToJson(content, 'api', true),
    }
}

function createTlDifference(old, mod) {
    const diff = {
        added: { classes: [], methods: [], unions: [] },
        removed: { classes: [], methods: [], unions: [] },
        modified: { classes: [], methods: [], unions: [] },
    }

    old = convertToArrays(old.tl)
    mod = convertToArrays(mod.tl)

    // create index for both old and mod
    const { oldIndex, modIndex } = (function () {
        function createIndex(it) {
            let ret = {}
            it.classes.forEach((obj) => {
                obj.uid = 'c_' + obj.name
                obj._type = 'classes'
                ret[obj.uid] = obj
            })
            it.methods.forEach((obj) => {
                obj.uid = 'm_' + obj.name
                obj._type = 'methods'
                ret[obj.uid] = obj
            })
            it.unions.forEach((obj) => {
                obj.uid = 'u_' + obj.type
                obj._type = 'unions'
                ret[obj.uid] = obj
            })
            return ret
        }

        return {
            oldIndex: createIndex(old),
            modIndex: createIndex(mod),
        }
    })()

    // find difference between constructor arguments
    function createArgsDifference(old, mod) {
        const diff = {
            added: [],
            removed: [],
            modified: [],
        }

        const { oldIndex, modIndex } = (function () {
            function createIndex(obj) {
                const ret = {}
                if (obj.arguments)
                    obj.arguments.forEach((arg) => (ret[arg.name] = arg))
                return ret
            }

            return {
                oldIndex: createIndex(old),
                modIndex: createIndex(mod),
            }
        })()

        Object.keys(modIndex).forEach((argName) => {
            if (!(argName in oldIndex)) {
                diff.added.push(modIndex[argName])
            } else {
                const old = oldIndex[argName]
                const mod = modIndex[argName]
                if (
                    old.type !== mod.type ||
                    old.optional !== mod.optional ||
                    mod.predicate !== mod.predicate
                ) {
                    diff.modified.push({
                        name: argName,
                        old: old,
                        new: mod,
                    })
                }
            }
        })

        Object.keys(oldIndex).forEach((argName) => {
            if (!(argName in modIndex)) {
                diff.removed.push(oldIndex[argName])
            }
        })

        return diff
    }

    Object.keys(modIndex).forEach((uid) => {
        if (!(uid in oldIndex)) {
            diff.added[modIndex[uid]._type].push(modIndex[uid])
        } else {
            const old = oldIndex[uid]
            const mod = modIndex[uid]

            const localDiff = {}

            const argDiff = createArgsDifference(old, mod)
            if (
                argDiff.removed.length ||
                argDiff.added.length ||
                argDiff.modified.length
            ) {
                localDiff.arguments = argDiff
            }

            if (old.id !== mod.id) localDiff.id = { old: old.id, new: mod.id }
            if (old.type !== mod.type)
                localDiff.type = { old: old.type, new: mod.type }
            if (old.returns !== mod.returns)
                localDiff.returns = { old: old.returns, new: mod.returns }

            if (Object.keys(localDiff).length) {
                localDiff.name = old.name
                diff.modified[oldIndex[uid]._type].push(localDiff)
            }
        }
    })

    Object.keys(oldIndex).forEach((uid) => {
        if (!(uid in modIndex)) {
            diff.removed[oldIndex[uid]._type].push(oldIndex[uid])
        }
    })

    return diff
}

function fileSafeDateFormat(date) {
    date = new Date(date)
    return date.toISOString().replace(/[\-:]|\.\d\d\d/g, '')
}

function shortSha(sha) {
    return sha.substr(0, 7)
}

async function fetchHistory(file, since, defaultParent = null) {
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

    function writeSchemaToFile(schema, commit) {
        return fs.promises.writeFile(
            path.join(__dirname, `../data/history/${filename(schema, commit)}`),
            JSON.stringify({
                tl: JSON.stringify(schema.tl),
                layer: parseInt(schema.layer),
                content: schema.content,
                // idk where parent: '00' comes from but whatever
                parent: schema.parent && schema.parent !== '00' ? schema.parent : defaultParent,
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

        const diff = createTlDifference(baseSchema, nextSchema)

        await fs.promises.writeFile(
            path.join(
                __dirname,
                `../data/diffs/${shortSha(base.sha)}-${shortSha(next.sha)}.json`
            ),
            JSON.stringify({
                ...diff,
                // yeah they sometimes update schema w/out changing layer number
                layer:
                    baseSchema.layer === nextSchema.layer
                        ? undefined
                        : nextSchema.layer,
            })
        )

        nextSchema.parent = baseFilename()
        base = next
        baseSchema = nextSchema
        await updateLastFetched(file, base.commit.committer.date)
        await writeSchemaToFile(baseSchema, base)
        console.log(
            'Fetched commit %s, file %s (%s)',
            shortSha(base.sha),
            file,
            base.commit.committer.date
        )
    }

    if (file !== CURRENT_FILE) {
        await updateLastFetched(file, 'DONE:' + baseFilename())
    }

    console.log('No more commits for %s', file)
}

async function main() {
    const last = await getLastFetched()
    for (let i = 0; i < FILES.length; i++) {
        const file = FILES[i]
        const prev = FILES[i - 1]
        if (!last[file].startsWith('DONE')) {
            let parent = prev ? last[prev].split(':')[1] : null
            await fetchHistory(file, last[file], parent)
        }
    }

    console.log('Creating reverse links ("next" field)')
    for (const file of await fs.promises.readdir(
        path.join(__dirname, '../data/history')
    )) {
        if (!file.startsWith('layer')) continue

        const fullPath = path.join(__dirname, '../data/history', file)
        const json = JSON.parse(await fs.promises.readFile(fullPath, 'utf-8'))
        if (json.parent) {
            const parentPath = path.join(__dirname, '../data/history', json.parent)
            const parentJson = JSON.parse(
                await fs.promises.readFile(
                    parentPath,
                    'utf-8'
                )
            )
            parentJson.next = parentPath
            await fs.promises.writeFile(parentPath, JSON.stringify(parentJson))
        }
    }
}

main().catch(console.error)
