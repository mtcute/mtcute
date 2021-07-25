const {
    convertTlToJson,
    convertJsonToTl,
} = require('../../packages/tl/scripts/generate-schema')
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const { convertToArrays } = require('./prepare-data')

const FETCH_UP_TO = 13

async function fetchAvailableLayers() {
    return fetch('https://core.telegram.org/schema')
        .then((i) => i.text())
        .then((html) => {
            const $ = cheerio.load(html)

            const links = $('a[href^="?layer="]').toArray().map((it) => it.attribs.href)

            let ret = []
            links.forEach((link) => {
                let m = link.match(/\?layer=(\d+)/)
                if (m) {
                    let layer = parseInt(m[1])
                    if (layer === 1 || layer > FETCH_UP_TO) return

                    ret.push(layer)
                }
            })

            return ret
        })
}

async function fetchFromLayer(layer) {
    const html = await fetch('https://core.telegram.org/schema', {
        headers: {
            cookie: `stel_dev_layer=${layer}`,
        },
    }).then((i) => i.text())

    const $ = cheerio.load(html)
    return $('.page_scheme code').text()
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
}

async function main() {
    // find first non-"old" layer, for linking
    let firstNext
    for (const file of fs.readdirSync(
        path.join(__dirname, '../data/history')
    )) {
        if (file.startsWith(`layer${FETCH_UP_TO + 1}-`)) {
            const json = JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, `../data/history/${file}`),
                    'utf-8'
                )
            )
            firstNext = json.uid

            json.prev = `${FETCH_UP_TO}_FROM_WEBSITE`
            json.prevFile = `layer${FETCH_UP_TO}-19700101-0000000.json`
            fs.writeFileSync(
                path.join(__dirname, `../data/history/${file}`),
                JSON.stringify(json)
            )

            break
        }
    }

    const layers = await fetchAvailableLayers()

    for (const l of layers) {
        const tl = await fetchFromLayer(l)
        const data = await convertTlToJson(tl, 'api', true)

        await fs.promises.writeFile(
            path.join(
                __dirname,
                `../data/history/layer${l}-19700101-0000000.json`
            ),
            JSON.stringify({
                // layer is ever-incrementing, sha is random, so no collisions
                uid: `${l}_FROM_WEBSITE`,
                tl: JSON.stringify(convertToArrays(data)),
                layer: l,
                rev: 0,
                content: tl,
                prev: l === 2 ? null : `${l - 1}_FROM_WEBSITE`,
                prevFile:
                    l === 2 ? null : `layer${l - 1}-19700101-0000000.json`,
                next: l === FETCH_UP_TO ? firstNext : `${l + 1}_FROM_WEBSITE`,
                source: {
                    website: true,
                    file: '',
                    date: '1970-01-01T00:00:00Z',
                    commit: '',
                    message: '',
                },
            })
        )

        console.log(`Fetched layer ${l}`)
    }
}

main().catch(console.error)
