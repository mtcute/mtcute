const crypto = require('node:crypto')
const path = require('node:path')
const fs = require('node:fs')
const cp = require('node:child_process')
const { Readable } = require('node:stream')

let git

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
let SKIP_PREBUILT = process.env.BUILD_FOR_DOCS === '1'

if (!GITHUB_TOKEN && !SKIP_PREBUILT) {
    console.warn('GITHUB_TOKEN is required to publish crypto-node, skipping prebuilt artifacts')
    SKIP_PREBUILT = true
}

const GITHUB_HEADERS = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
}
const API_PREFIX = 'https://api.github.com/repos/mtcute/mtcute/actions/workflows/node-prebuilt.yaml'
const PLATFORMS = ['ubuntu', 'macos', 'windows']

async function findArtifactsByHash(hash) {
    const runs = await fetch(`${API_PREFIX}/runs?per_page=100`, { headers: GITHUB_HEADERS }).then(r => r.json())

    for (const run of runs.workflow_runs) {
        if (run.conclusion !== 'success' || run.status !== 'completed') continue

        const artifacts = await fetch(`${run.url}/artifacts`, { headers: GITHUB_HEADERS })
            .then(r => r.json())
            .then(r => r.artifacts)

        for (const it of artifacts) {
            if (it.expired) continue
            const parts = it.name.split('-')

            if (parts[0] === 'prebuilt'
              && PLATFORMS.includes(parts[1])
              && parts[3] === hash) {
                return artifacts
            }
        }
    }

    return null
}

async function runWorkflow(commit, hash) {
    const createRes = await fetch(`${API_PREFIX}/dispatches`, {
        method: 'POST',
        headers: GITHUB_HEADERS,
        body: JSON.stringify({
            ref: git.getCurrentBranch(),
            inputs: { commit, hash },
        }),
    })

    if (createRes.status !== 204) {
        const text = await createRes.text()
        throw new Error(`Failed to run workflow: ${createRes.status} ${text}`)
    }

    // wait for the workflow to finish
    // github api is awesome and doesn't return the run id, so let's just assume it's the last one
    await new Promise(resolve => setTimeout(resolve, 5000))
    const runsRes = await fetch(`${API_PREFIX}/runs`, {
        headers: GITHUB_HEADERS,
    }).then(r => r.json())

    let run = runsRes.workflow_runs[0]

    while (run.status === 'queued' || run.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 5000))
        run = await fetch(run.url, { headers: GITHUB_HEADERS }).then(r => r.json())
    }

    if (run.status !== 'completed') {
        throw new Error(`Workflow ${run.id} failed: ${run.status}`)
    }

    if (run.conclusion !== 'success') {
        throw new Error(`Workflow ${run.id} failed: ${run.conclusion}`)
    }

    // fetch artifacts
    const artifacts = await fetch(`${run.url}/artifacts`, { headers: GITHUB_HEADERS })
        .then(r => r.json())
        .then(r => r.artifacts)

    // validate their names
    for (const it of artifacts) {
        const parts = it.name.split('-')

        if (parts[0] !== 'prebuilt'
          || !PLATFORMS.includes(parts[1])
          || parts[3] !== hash) {
            throw new Error(`Invalid artifact name: ${it.name}`)
        }
    }

    return artifacts
}

async function extractArtifacts(artifacts) {
    fs.mkdirSync(path.join(__dirname, 'dist/prebuilds'), { recursive: true })
    await Promise.all(
        artifacts.map(async (it) => {
            const platform = it.name.split('-').slice(1, 3).join('-')

            const res = await fetch(it.archive_download_url, {
                headers: GITHUB_HEADERS,
                redirect: 'manual',
            })

            if (res.status !== 302) {
                const text = await res.text()
                throw new Error(`Failed to download artifact ${it.name}: ${res.status} ${text}`)
            }

            const zip = await fetch(res.headers.get('location'))

            const outFile = path.join(__dirname, 'dist/prebuilds', `${platform}.zip`)
            const stream = fs.createWriteStream(outFile)

            await new Promise((resolve, reject) => {
                stream.on('finish', resolve)
                stream.on('error', reject)
                Readable.fromWeb(zip.body).pipe(stream)
            })

            // extract the zip
            await new Promise((resolve, reject) => {
                const child = cp.spawn('unzip', [outFile, '-d', path.join(__dirname, 'dist/prebuilds')], {
                    stdio: 'inherit',
                })

                child.on('exit', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Failed to extract ${outFile}: ${code}`))
                    } else {
                        resolve()
                    }
                })
            })
            fs.unlinkSync(outFile)
        }),
    )
}

module.exports = ({ fs, glob, path, packageDir, outDir }) => ({
    async final() {
        // eslint-disable-next-line import/no-relative-packages
        git = await import('../../scripts/git-utils.js')
        const libDir = path.join(packageDir, 'lib')

        if (!SKIP_PREBUILT) {
            // generate sources hash
            const hashes = []

            for (const file of glob.sync(path.join(libDir, '**/*'))) {
                const hash = crypto.createHash('sha256')
                hash.update(fs.readFileSync(file))
                hashes.push(hash.digest('hex'))
            }

            const hash = crypto.createHash('sha256')
                .update(hashes.join('\n'))
                .digest('hex')
            console.log(hash)

            console.log('[i] Checking for prebuilt artifacts for %s', hash)
            let artifacts = await findArtifactsByHash(hash)

            if (!artifacts) {
                console.log('[i] No artifacts found, running workflow')
                artifacts = await runWorkflow(git.getCurrentCommit(), hash)
            }

            console.log('[i] Extracting artifacts')
            await extractArtifacts(artifacts)
        }

        // copy native sources and binding.gyp file

        fs.cpSync(libDir, path.join(outDir, 'lib'), { recursive: true })

        const bindingGyp = fs.readFileSync(path.join(packageDir, 'binding.gyp'), 'utf8')
        fs.writeFileSync(
            path.join(outDir, 'binding.gyp'),
            bindingGyp
                // replace paths to crypto
                .replace(/"\.\.\/crypto/g, '"crypto'),
        )

        // for some unknown fucking reason ts doesn't do this
        fs.copyFileSync(path.join(packageDir, 'src/native.cjs'), path.join(outDir, 'cjs/native.cjs'))
        fs.copyFileSync(path.join(packageDir, 'src/native.cjs'), path.join(outDir, 'esm/native.cjs'))
    },
})
