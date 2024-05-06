// this scripts publishes our e2e-tested builds to canary jsr instance
// at this point, we should have all our packages installed in local jsr instance
// (or more specifically, in our .jsr-data/gcs directory)
// so it should be safe to just copy them from there and `deno publish` them

import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
import * as stc from 'npm:@teidesu/slow-types-compiler@1.1.0'
import { globSync } from 'npm:glob'
import * as semver from 'npm:semver'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

// setup tokens
const { JSR_TOKEN, REGISTRY } = process.env

if (!JSR_TOKEN || !REGISTRY) {
    console.error('Missing JSR_TOKEN, REGISTRY or CURRENT_COMMIT env variables!')
    process.exit(1)
}

const commit = execSync('git rev-parse HEAD').toString().trim().slice(0, 7)

const workDir = path.join(__dirname, 'temp')
fs.mkdirSync(workDir, { recursive: true })

const GCS_BASE_DIR = path.join(__dirname, '.jsr-data/gcs/modules/@mtcute')

const packages = fs.readdirSync(GCS_BASE_DIR)

async function main() {
    const versions = {}
    const deps = {}

    // prepare working directory
    for (const pkg of packages) {
        const metaJson = JSON.parse(fs.readFileSync(path.join(GCS_BASE_DIR, pkg, 'meta.json'), 'utf8'))
        const version = metaJson.latest

        fs.cpSync(path.join(GCS_BASE_DIR, pkg, version), path.join(workDir, pkg), { recursive: true })

        versions[pkg] = `${version}-git.${commit}`

        const denoJson = JSON.parse(fs.readFileSync(path.join(workDir, pkg, 'deno.json'), 'utf8'))
        deps[pkg] = denoJson.imports ?
            Object.keys(denoJson.imports)
                .filter((x) => x.startsWith('@mtcute/'))
                .map((x) => x.slice('@mtcute/'.length)) :
            []
    }

    for (const pkg of stc.determinePublishOrder(deps)) {
        const pkgDir = path.join(workDir, pkg)

        const denoJsonPath = path.join(pkgDir, 'deno.json')
        const denoJson = JSON.parse(fs.readFileSync(denoJsonPath, 'utf8'))

        denoJson.version = versions[pkg]

        for (const dep of Object.keys(denoJson.imports)) {
            if (!dep.startsWith('@mtcute/')) {
                // force use jsr.io
                const value = denoJson.imports[dep]

                if (value.startsWith('jsr:')) {
                    const [, dep, version] = value.match(/^jsr:(@.+\/.+)@(.+)$/)

                    const meta = await fetch(`https://jsr.io/${dep}/meta.json`).then((x) => x.json())
                    const pinVersion = semver.maxSatisfying(Object.keys(meta.versions), version)

                    denoJson.imports[dep] = `https://jsr.io/${dep}/${pinVersion}`
                }

                continue
            }

            denoJson.imports[dep] = `${REGISTRY}/${dep}/${versions[dep.replace('@mtcute/', '')]}`
        }

        fs.writeFileSync(denoJsonPath, JSON.stringify(denoJson, null, 4))

        // we also need to replace all imports in .ts files
        const tsFiles = globSync('**/*.ts', { cwd: pkgDir })

        for (const file of tsFiles) {
            const filePath = path.join(pkgDir, file)
            const content = fs.readFileSync(filePath, 'utf8')

            const newContent = content.replace(
                /from\s+['"]jsr:\/?@mtcute\/(.+?)@(.+?)['"]/g,
                (_, dep) => `from "${REGISTRY}/@mtcute/${dep}/${versions[dep]}"`,
            )

            fs.writeFileSync(filePath, newContent)
        }

        execSync(`deno publish --allow-dirty -q --token ${JSR_TOKEN}`, {
            cwd: pkgDir,
            stdio: 'inherit',
            env: {
                ...process.env,
                JSR_URL: REGISTRY,
            },
        })
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
