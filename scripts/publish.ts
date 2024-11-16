import * as cp from 'node:child_process'
import { createRequire } from 'node:module'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import { jsrCheckVersion, jsrMaybeCreatePackage } from '@fuman/build/jsr'
import type { WorkspacePackage } from '@fuman/build'
import { collectPackageJsons, exec, filterPackageJsonsForPublish, npmCheckVersion, sortWorkspaceByPublishOrder, writeGithubActionsOutput } from '@fuman/build'

const IS_JSR = process.env.JSR === '1'
const MAIN_REGISTRY = IS_JSR ? 'https://jsr.io/' : 'https://registry.npmjs.org'
let REGISTRY = process.env.REGISTRY || MAIN_REGISTRY

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

async function checkVersion(name: string, version: string) {
    return IS_JSR
        ? jsrCheckVersion({ package: `@mtcute/${name}`, version, registry: REGISTRY })
        : npmCheckVersion({ package: `@mtcute/${name}`, version, registry: REGISTRY })
}

async function publishSinglePackage(name: string) {
    const packageDir = path.join(__dirname, '../packages', name)

    console.log('[i] Building %s', name)

    await exec(['pnpm', 'run', 'build-package', name], { stdio: 'inherit' })

    console.log('[i] Publishing %s', name)

    const version = IS_JSR
        ? require(path.join(packageDir, 'dist/jsr/deno.json')).version
        : require(path.join(packageDir, 'dist/package.json')).version

    const exists = await checkVersion(name, version)

    if (exists) {
        if (process.env.E2E && !IS_JSR) {
            console.log('[i] %s already exists, unpublishing..', name)
            await exec(['npm', 'unpublish', '--registry', REGISTRY, '--force', `@mtcute/${name}`], {
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
        await exec(['deno', 'publish', '--allow-dirty', '--quiet', params], {
            cwd: path.join(packageDir, 'dist'),
            stdio: 'inherit',
        })
    } else {
        // publish to npm
        const params = REGISTRY === MAIN_REGISTRY ? '--access public' : '--force'
        await exec(['npm', 'publish', '--registry', REGISTRY, params, '-q'], {
            cwd: path.join(packageDir, 'dist'),
            stdio: 'inherit',
        })
    }
}

async function listPackages(all = false): Promise<WorkspacePackage[]> {
    let packages = await collectPackageJsons(path.join(__dirname, '..'))
    if (!all) {
        filterPackageJsonsForPublish(packages, IS_JSR ? 'jsr' : 'npm')
    }

    if (IS_JSR) {
        packages = sortWorkspaceByPublishOrder(packages)
        console.log('[i] Publishing order:', packages.map(it => it.json.name).join(', '))
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
        for (const pkg of await listPackages()) {
            const pkgVersion = require(`../packages/${pkg}/package.json`).version
            const published = await checkVersion(pkg.json.name!, pkgVersion)

            if (published && !process.env.E2E) {
                console.log('[i] %s is up to date', pkg)
                continue
            }

            try {
                await publishSinglePackage(pkg.json.name!)
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

        writeGithubActionsOutput('tarballs', tarballs.join(','))
    }

    process.exit(0) // idk why but it sometimes hangs indefinitely
}

export { listPackages, main, EXPORTED_REGISTRY as REGISTRY }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await main()
}
