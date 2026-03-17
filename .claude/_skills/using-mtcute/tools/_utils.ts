import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

import { distance } from 'fastest-levenshtein'

const PLATFORM_PACKAGES = ['@mtcute/node', '@mtcute/bun', '@mtcute/deno', '@mtcute/web', '@mtcute/core']

const rootRequire = createRequire(join(process.cwd(), '__stub.js'))

function findPackageRoot(req: NodeJS.Require, startDir: string): string {
  let dir = startDir
  for (let i = 0; i < 5; i++) {
    try {
      req.resolve(`${dir}/package.json`)
      return dir
    } catch {
      dir = dirname(dir)
    }
  }
  return startDir
}

// returns the directory containing `highlevel/` in @mtcute/core
// (published: package root; monorepo: `dist/` subfolder)
function withDistFallback(pkgDir: string): string {
  if (existsSync(join(pkgDir, 'highlevel'))) return pkgDir
  const dist = join(pkgDir, 'dist')
  if (existsSync(join(dist, 'highlevel'))) return dist
  return pkgDir
}

interface MtcuteResolution {
  version: string
  workspaceDir: string
}

// try to find an @mtcute/* package using `req` created from `fromDir`
// returns the version + fromDir, or null
function tryResolveMtcuteFrom(fromDir: string): MtcuteResolution | null {
  const req = createRequire(join(fromDir, '__stub.js'))
  for (const pkg of PLATFORM_PACKAGES) {
    try {
      req.resolve(pkg)
      const pkgJsonPath = join(fromDir, 'node_modules', pkg.replace('/', '/'.replace('/', '/')), 'package.json')
      // for hoisted layouts the package.json might not be right next to node_modules
      // just read version from wherever we can
      let version = 'unknown'
      try {
        const entry = req.resolve(pkg)
        const pkgDir = findPackageRoot(req, dirname(entry))
        const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
        version = pkgJson.version ?? 'unknown'
      } catch {
        try {
          version = JSON.parse(readFileSync(pkgJsonPath, 'utf8')).version ?? 'unknown'
        } catch {}
      }
      return { version, workspaceDir: fromDir }
    } catch {}
  }
  return null
}

// expand simple glob patterns (only `*` and `**` in the last segment, like pnpm-workspace.yaml uses)
function expandWorkspaceGlobs(rootDir: string, patterns: string[]): string[] {
  const dirs: string[] = []
  for (const pattern of patterns) {
    if (pattern.startsWith('!')) continue
    const clean = pattern.replace(/\/\*\*?$/, '')
    const fullDir = resolve(rootDir, clean)
    if (!existsSync(fullDir)) continue

    if (pattern.endsWith('/**') || pattern.endsWith('/*')) {
      // enumerate subdirectories
      try {
        for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
          if ((!entry.isDirectory() && !entry.isSymbolicLink()) || entry.name.startsWith('.')) continue
          const sub = join(fullDir, entry.name)
          if (existsSync(join(sub, 'package.json'))) {
            dirs.push(sub)
          }
        }
      } catch {}
    } else if (existsSync(join(fullDir, 'package.json'))) {
      dirs.push(fullDir)
    }
  }
  return dirs
}

function getWorkspacePackageDirs(): string[] {
  const cwd = process.cwd()

  // pnpm-workspace.yaml
  const pnpmWsPath = join(cwd, 'pnpm-workspace.yaml')
  if (existsSync(pnpmWsPath)) {
    const content = readFileSync(pnpmWsPath, 'utf8')
    // simple yaml parsing — extract items from `packages:` array
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const match = content.match(/packages:\s*\n((?:\s+-\s+.+\n?)+)/)
    if (match) {
      const patterns = match[1]
        .split('\n')
        .map(l => l.replace(/^\s*-\s*/, '').replace(/["']/g, '').trim())
        .filter(Boolean)
      return expandWorkspaceGlobs(cwd, patterns)
    }
  }

  // package.json workspaces field
  const pkgJsonPath = join(cwd, 'package.json')
  if (existsSync(pkgJsonPath)) {
    try {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
      const workspaces = Array.isArray(pkgJson.workspaces)
        ? pkgJson.workspaces
        : pkgJson.workspaces?.packages
      if (Array.isArray(workspaces) && workspaces.length > 0) {
        return expandWorkspaceGlobs(cwd, workspaces)
      }
    } catch {}
  }

  return []
}

function resolveFromWorkspaces<T>(directResolve: (req: NodeJS.Require) => T | null): T {
  // first try direct resolution from cwd
  const direct = directResolve(rootRequire)
  if (direct !== null) return direct

  // try workspace packages
  const wsDirs = getWorkspacePackageDirs()
  if (wsDirs.length === 0) {
    throw new Error('Could not find any @mtcute/* package. Is mtcute installed?')
  }

  const found: MtcuteResolution[] = []
  for (const dir of wsDirs) {
    const res = tryResolveMtcuteFrom(dir)
    if (res) found.push(res)
  }

  if (found.length === 0) {
    throw new Error('Could not find any @mtcute/* package in workspace packages. Is mtcute installed?')
  }

  // check for version conflicts
  const versions = new Map<string, string[]>()
  for (const { version, workspaceDir } of found) {
    const list = versions.get(version) ?? []
    list.push(workspaceDir)
    versions.set(version, list)
  }

  if (versions.size > 1) {
    let msg = 'Multiple versions of @mtcute/* found in workspace packages:\n'
    for (const [version, dirs] of versions) {
      for (const dir of dirs) {
        msg += `  ${dir}: v${version}\n`
      }
    }
    msg += '\nPlease cd into the specific package directory before running this tool.'
    throw new Error(msg)
  }

  // all same version — use the first one
  const wsReq = createRequire(join(found[0].workspaceDir, '__stub.js'))
  const result = directResolve(wsReq)
  if (result !== null) return result

  throw new Error('Could not find @mtcute/* package. Is mtcute installed?')
}

export function resolveMtcuteFile(subpath: string): string {
  return resolveFromWorkspaces((req) => {
    // try direct resolution
    for (const pkg of PLATFORM_PACKAGES) {
      try {
        return req.resolve(`${pkg}/${subpath}`)
      } catch {}
    }
    // try resolving from within a found platform package (pnpm transitive dep compat)
    for (const pkg of PLATFORM_PACKAGES) {
      try {
        const entry = req.resolve(`${pkg}`)
        const pkgDir = findPackageRoot(req, dirname(entry))
        const pkgReq = createRequire(join(pkgDir, '__stub.js'))
        for (const targetPkg of PLATFORM_PACKAGES) {
          try {
            return pkgReq.resolve(`${targetPkg}/${subpath}`)
          } catch {}
        }
      } catch {}
    }
    return null
  })
}

export function resolveMtcuteCoreDir(): string {
  return resolveFromWorkspaces((req) => {
    for (const pkg of PLATFORM_PACKAGES) {
      try {
        const entry = req.resolve(`${pkg}`)
        const pkgDir = findPackageRoot(req, dirname(entry))
        if (pkg === '@mtcute/core') return withDistFallback(pkgDir)
        // resolve @mtcute/core from within the platform package (pnpm compat)
        const coreReq = createRequire(join(pkgDir, '__stub.js'))
        const coreEntry = coreReq.resolve('@mtcute/core')
        const coreDir = findPackageRoot(coreReq, dirname(coreEntry))
        return withDistFallback(coreDir)
      } catch {}
    }
    return null
  })
}

export interface FuzzyResult<T> {
  item: T
  name: string
  dist: number
}

export function fuzzyMatch<T>(
  query: string,
  items: T[],
  getName: (item: T) => string,
): { exact: T[], fuzzy: FuzzyResult<T>[] } {
  const queryLower = query.toLowerCase()
  const exact = items.filter(item => getName(item).toLowerCase() === queryLower)

  if (exact.length > 0) return { exact, fuzzy: [] }

  const fuzzy = items
    .map((item) => {
      const name = getName(item)
      return { item, name, dist: distance(queryLower, name.toLowerCase()) }
    })
    .sort((a, b) => a.dist - b.dist)

  return { exact: [], fuzzy }
}

export function autoCorrectOrFail(
  query: string,
  fuzzy: FuzzyResult<unknown>[],
  partialMatches: string[],
): void {
  if (partialMatches.length > 0) {
    console.error(`No exact match for "${query}". Similar:`)
    for (const name of partialMatches.slice(0, 20)) {
      console.error(`  ${name}`)
    }
  } else if (fuzzy.length > 0 && fuzzy[0].dist <= 5) {
    console.error(`No match for "${query}". Did you mean:`)
    for (const s of fuzzy.filter(s => s.dist <= 5).slice(0, 10)) {
      console.error(`  ${s.name}`)
    }
  } else {
    console.error(`Nothing found matching "${query}"`)
  }
  process.exit(1)
}

export function tryAutoCorrect<T>(
  query: string,
  fuzzy: FuzzyResult<T>[],
): T | null {
  if (fuzzy.length === 0 || fuzzy[0].dist > 2) return null

  const bestDist = fuzzy[0].dist
  const atBest = fuzzy.filter(s => s.dist === bestDist)

  if (atBest.length === 1) {
    console.error(`(assuming "${atBest[0].name}" for "${query}")`)
    console.error()
    return atBest[0].item
  }

  return null
}

export function parseArgs(): { flags: Set<string>, positional: string | undefined } {
  const args = process.argv.slice(2)
  const flags = new Set<string>()
  let positional: string | undefined

  for (const arg of args) {
    if (arg.startsWith('--')) {
      flags.add(arg)
    } else if (!positional) {
      positional = arg
    }
  }

  return { flags, positional }
}
