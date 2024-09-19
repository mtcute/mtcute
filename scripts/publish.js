import * as cp from 'node:child_process'
import * as fs from 'node:fs'
import { createRequire } from 'node:module'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import { determinePublishOrder, jsrMaybeCreatePackage } from '@fuman/jsr'

const IS_JSR = process.env.JSR === '1'
const MAIN_REGISTRY = IS_JSR ? 'https://jsr.io/' : 'https://registry.npmjs.org'
let REGISTRY = process.env.REGISTRY || MAIN_REGISTRY
const EXPORTED_REGISTRY = REGISTRY

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const require = createRequire(import.meta.url)

if (!REGISTRY.endsWith('/')) REGISTRY += '/'

if (process.env.E2E && IS_JSR) {
    // running behind a socat proxy seems to fix some of the docker networking issues (thx kamillaova)
    const hostname = new URL(REGISTRY).hostname
    const port = new URL(REGISTRY).port || { 'http:': 80, 'https:': 443 }[new URL(REGISTRY).protocol]
    cp.spawn('bash', ['-c', `socat TCP-LISTEN:1234,fork,reuseaddr TCP4:${hostname}:${port}`], { stdio: 'ignore' })
    REGISTRY = 'http://localhost:1234/'
}

if (IS_JSR) {
    // for the underlying tools that expect JSR_URL env var
    process.env.JSR_URL = REGISTRY
}

const JSR_EXCEPTIONS = {
    'bun': 'never',
    'create-bot': 'never',
    'crypto-node': 'never',
    'deno': 'only',
    'node': 'never',
    'http-proxy': 'never',
    'socks-proxy': 'never',
    'mtproxy': 'never',
    'test': 'never',
}

function fetchRetry(url, init, retry = 0) {
    return fetch(url, init).catch((err) => {
        if (retry >= 5) throw err

        // for whatever reason this request sometimes fails with ECONNRESET
        // no idea why, probably some issue in docker networking
        if (err.cause?.code !== 'UND_ERR_SOCKET') {
            console.log('[i] Error fetching %s:', url)
            console.log(err)
        }

        return new Promise(resolve => setTimeout(resolve, 1000)).then(() => fetchRetry(url, init, retry + 1))
    })
}

async function checkVersion(name, version) {
    const registry = REGISTRY

    const url = IS_JSR ? `${registry}@mtcute/${name}/${version}_meta.json` : `${registry}@mtcute/${name}/${version}`

    return fetchRetry(url).then(r => r.status === 200)
}

async function publishSinglePackage(name) {
    const packageDir = path.join(__dirname, '../packages', name)

    console.log('[i] Building %s', name)

    // run build script
    cp.execSync(`pnpm run build-package ${name}`, {
        stdio: 'inherit',
    })

    console.log('[i] Publishing %s', name)

    const version = IS_JSR
        ? require(path.join(packageDir, 'dist/jsr/deno.json')).version
        : require(path.join(packageDir, 'dist/package.json')).version

    const exists = await checkVersion(name, version)

    if (exists) {
        if (process.env.E2E && !IS_JSR) {
            console.log('[i] %s already exists, unpublishing..', name)
            cp.execSync(`npm unpublish --registry ${REGISTRY} --force @mtcute/${name}`, {
                cwd: path.join(packageDir, 'dist'),
                stdio: 'inherit',
            })
        } else {
            console.log('[i] %s already exists, skipping..', name)

            return
        }
    } else if (IS_JSR && process.env.JSR_TOKEN) {
        await jsrMaybeCreatePackage({
            name: `@mtcute/${name}`,
            token: process.env.JSR_TOKEN,
            registry: REGISTRY,
        })
    }

    if (IS_JSR) {
        // publish to jsr
        const params = process.env.JSR_TOKEN ? `--token ${process.env.JSR_TOKEN}` : ''
        cp.execSync(`deno publish --allow-dirty --quiet ${params}`, {
            cwd: path.join(packageDir, 'dist/jsr'),
            stdio: 'inherit',
        })
    } else {
        // make sure dist/jsr doesn't exist (it shouldn't, but just in case)
        if (fs.existsSync(path.join(packageDir, 'dist/jsr'))) {
            fs.rmdirSync(path.join(packageDir, 'dist/jsr'), { recursive: true })
        }

        // publish to npm
        const params = REGISTRY === MAIN_REGISTRY ? '--access public' : '--force'
        cp.execSync(`npm publish --registry ${REGISTRY} ${params} -q`, {
            cwd: path.join(packageDir, 'dist'),
            stdio: 'inherit',
        })
    }
}

function listPackages(all = false) {
    let packages = []

    for (const f of fs.readdirSync(path.join(__dirname, '../packages'))) {
        if (f[0] === '.') continue

        if (f === 'mtproxy' || f === 'socks-proxy' || f === 'http-proxy' || f === 'bun') {
            // todo: return once we figure out fuman
            continue
        }

        if (!all) {
            if (IS_JSR && JSR_EXCEPTIONS[f] === 'never') continue
            if (!IS_JSR && JSR_EXCEPTIONS[f] === 'only') continue
        }

        packages.push(f)
    }

    if (IS_JSR) {
        // we should sort them in a way that dependencies are published first. stc has a util for that
        const map = {}

        for (const pkg of packages) {
            const deps = require(`../packages/${pkg}/package.json`).dependencies || {}
            map[pkg] = Object.keys(deps)
                .filter(d => d.startsWith('@mtcute/'))
                .map(d => d.slice(8))
        }

        packages = determinePublishOrder(map)
        console.log('[i] Publishing order:', packages.join(', '))
    }

    return packages
}

async function main(arg = process.argv[2]) {
    if (!arg) {
        console.log('Usage: publish.js <package name | all | updated>')
        process.exit(0)
    }

    console.log('[i] Using registry %s', REGISTRY)

    const publishedPkgs = []
    const failedPkgs = []

    if (arg === 'all' || arg === 'updated') {
        for (const pkg of listPackages()) {
            const pkgVersion = require(`../packages/${pkg}/package.json`).version
            const published = await checkVersion(pkg, pkgVersion)

            if (published && !process.env.E2E) {
                console.log('[i] %s is up to date', pkg)
                continue
            }

            try {
                await publishSinglePackage(pkg)
                publishedPkgs.push(pkg)
            } catch (e) {
                console.error('[!] Failed to publish %s:', pkg)
                console.error(e)
                if (IS_JSR || process.env.E2E) throw e
                failedPkgs.push(pkg)
            }
        }
    } else {
        let pkgs = arg.split(',')
        const filteredPkgs = []

        const deps = {}
        // determine the order of packages to publish

        for (const pkg of pkgs) {
            if (IS_JSR && JSR_EXCEPTIONS[pkg] === 'never') continue
            if (!IS_JSR && JSR_EXCEPTIONS[pkg] === 'only') continue

            filteredPkgs.push(pkg)

            if (IS_JSR) {
                const pkgDeps = require(`../packages/${pkg}/package.json`).dependencies || {}
                deps[pkg] = Object.keys(pkgDeps)
                    .filter(d => d.startsWith('@mtcute/'))
                    .map(d => d.slice(8))
            }
        }

        pkgs = filteredPkgs

        if (IS_JSR) {
            pkgs = determinePublishOrder(deps)
        }

        for (const pkg of pkgs) {
            try {
                await publishSinglePackage(pkg)
                publishedPkgs.push(pkg)
            } catch (e) {
                console.error('[!] Failed to publish %s:', pkg)
                console.error(e)
                if (IS_JSR || process.env.E2E) throw e

                failedPkgs.push(pkg)
            }
        }
    }

    if (failedPkgs.length > 0) {
        console.error('[!] Failed to publish packages:')

        for (const pkg of failedPkgs) {
            console.error('  - %s', pkg)
        }
        process.exit(1)
    }

    if (process.env.GH_RELEASE) {
        // we should also generate tgz files for all published packages
        // for a github release, and also generate a title
        const tarballs = []

        for (const pkg of publishedPkgs) {
            const dir = path.join(__dirname, '../packages', pkg, 'dist')
            const tar = cp.execSync('npm pack -q', { cwd: dir })
            tarballs.push(path.join(dir, tar.toString().trim()))
        }

        fs.writeFileSync(process.env.GITHUB_OUTPUT, `tarballs=${tarballs.join(',')}\n`, { flag: 'a' })
    }

    process.exit(0) // idk why but it sometimes hangs indefinitely
}

export { listPackages, main, EXPORTED_REGISTRY as REGISTRY }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await main()
}
