const fs = require('fs')
const path = require('path')
const { createTlSchemaDifference } = require('./diff-utils')

function generateDiffs() {
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

    schemas.sort((a, b) => {
        if (a.layer !== b.layer) return b.layer - a.layer

        return a.source.date < b.source.date ? 1 : -1
    })

    // create diff between consecutive pairs.
    // that way, we can diff any two given schemas by simply
    // merging the diff using `seq`

    let prev = schemas.pop()
    let seq = 0

    while (schemas.length) {
        const current = schemas.pop()

        const uid = `${prev.layer}r${prev.rev}-${current.layer}r${current.rev}`
        const diff = createTlSchemaDifference(prev, current)

        fs.writeFileSync(path.join(__dirname, `../data/diffs/${uid}.json`), JSON.stringify({
            seq: seq++,
            uid,
            diff: JSON.stringify(diff),
            prev: {
                layer: prev.layer,
                rev: prev.rev
            },
            new: {
                layer: current.layer,
                rev: current.rev
            }
        }))

        prev = current
    }
}

generateDiffs()
