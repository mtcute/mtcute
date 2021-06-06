const fs = require('fs')
const path = require('path')
const {
    createTlSchemaIndex,
    createTlUnionsDifference,
    createTlConstructorDifference,
} = require('./diff-utils')

function generateTypeHistory() {
    // first, load all schemas in memory (expensive, but who cares)
    const schemas = []

    for (const file of fs.readdirSync(
        path.join(__dirname, '../data/history')
    )) {
        if (!file.startsWith('layer')) continue

        const fullPath = path.join(__dirname, '../data/history', file)
        const json = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))

        json.tl = JSON.parse(json.tl)
        delete json.content // useless here
        schemas.push(json)
    }

    // create a set of all types that have ever existed
    const types = new Set()

    for (const s of schemas) {
        s.tl.classes.forEach((it) => types.add('c_' + it.name))
        s.tl.methods.forEach((it) => types.add('m_' + it.name))
        s.tl.unions.forEach((it) => types.add('u_' + it.type))
    }

    function getSchemaInfo(schema) {
        return {
            ...schema.source,
            layer: schema.layer,
            rev: schema.rev
        }
    }

    schemas.sort((a, b) => {
        if (a.layer !== b.layer) return b.layer - a.layer

        return a.source.date < b.source.date ? 1 : -1
    })

    const history = {}

    const base = schemas.pop()
    const baseSchemaInfo = getSchemaInfo(base)

    let prevIndex = createTlSchemaIndex(base.tl)

    Object.entries(prevIndex).forEach(([uid, item]) => {
        if (!(history[uid])) history[uid] = []

        // type was in the first scheme, assume it was added there
        history[uid].push({
            action: 'added',
            in: baseSchemaInfo,
            diff: item
        })
    })

    // for every schema, check changes for each type

    while (schemas.length) {
        const schema = schemas.pop()
        const schemaInfo = getSchemaInfo(schema)
        const newIndex = createTlSchemaIndex(schema.tl)

        types.forEach((uid) => {
            if (!(uid in history)) history[uid] = []

            if (!(uid in prevIndex) && uid in newIndex) {
                // type added
                history[uid].push({
                    action: 'added',
                    in: schemaInfo,
                    diff: newIndex[uid]
                })
            }

            if (uid in prevIndex && !(uid in newIndex)) {
                // type removed
                history[uid].push({
                    action: 'removed',
                    in: schemaInfo,
                })
            }

            if (uid in prevIndex && uid in newIndex) {
                // modified (maybe)

                let diff
                if (uid.match(/^u_/)) {
                    // union
                    diff = createTlUnionsDifference(
                        prevIndex[uid],
                        newIndex[uid]
                    )
                } else {
                    diff = createTlConstructorDifference(
                        prevIndex[uid],
                        newIndex[uid]
                    )
                }

                if (diff) {
                    history[uid].push({
                        action: 'modified',
                        in: schemaInfo,
                        diff,
                    })
                }
            }
        })

        prevIndex = newIndex
    }

    Object.entries(history).forEach(([uid, history]) => {
        if (!history.length) return

        history.forEach((it) => {
            // for simpler graphql queries
            if (it.diff) it.diff = JSON.stringify(it.diff)
        })

        // anti-chronological order
        history.reverse()

        fs.writeFileSync(
            path.join(__dirname, `../data/types/${uid}.json`),
            JSON.stringify({
                uid,
                type: {
                    c: 'class',
                    m: 'method',
                    u: 'union'
                }[uid[0]],
                name: uid.slice(2),
                history,
            })
        )
    })
}

generateTypeHistory()
