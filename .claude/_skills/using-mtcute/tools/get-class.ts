import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { autoCorrectOrFail, fuzzyMatch, parseArgs, resolveMtcuteCoreDir, tryAutoCorrect } from './_utils.js'

interface ParsedExport {
  name: string
  kind: 'class' | 'interface' | 'type' | 'enum' | 'function' | 'const'
  jsdoc: string
  description: string
  body: string
  full: string
  file: string
}

function dedent(text: string): string {
  const lines = text.split('\n')
  let minIndent = Infinity
  for (const line of lines) {
    if (line.trim().length === 0) continue
    const indent = line.search(/\S/)
    if (indent >= 0 && indent < minIndent) minIndent = indent
  }
  if (!Number.isFinite(minIndent) || minIndent === 0) return text
  return lines.map(line => line.slice(minIndent)).join('\n')
}

function extractDescription(jsdoc: string): string {
  const match = jsdoc.match(/\*\s+(?:\*\s*)?(.+)/)
  return match ? match[1].replace(/\*\/$/, '').trim() : ''
}

async function collectDtsFiles(dir: string): Promise<string[]> {
  const results: string[] = []

  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await collectDtsFiles(fullPath))
    } else if (entry.name.endsWith('.d.ts') && !entry.name.endsWith('.test.d.ts') && entry.name !== 'index.d.ts') {
      results.push(fullPath)
    }
  }

  return results
}

function parseExports(content: string, file: string): ParsedExport[] {
  const exports: ParsedExport[] = []

  // match: optional jsdoc, then export declaration
  // eslint-disable-next-line regexp/no-super-linear-backtracking, style/max-len
  const re = /(?<jsdoc>[ \t]*\/\*\*(?:(?!\*\/)[\s\S])*?\*\/\s*)?export (?:declare )?(?<kind>class|interface|type|enum|function|const) (?<name>\w+)/g

  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    const { jsdoc, kind, name } = match.groups!

    const declStart = match.index + (jsdoc?.length ?? 0)

    // find the end of this declaration
    let bodyEnd: number
    if (kind === 'class' || kind === 'interface' || kind === 'enum') {
      // find matching closing brace
      const braceStart = content.indexOf('{', declStart)
      if (braceStart === -1) continue
      let depth = 1
      let i = braceStart + 1
      while (i < content.length && depth > 0) {
        if (content[i] === '{') depth++
        else if (content[i] === '}') depth--
        i++
      }
      bodyEnd = i
    } else {
      // type alias, function, const — find the semicolon
      bodyEnd = content.indexOf(';', declStart)
      if (bodyEnd === -1) continue
      bodyEnd += 1
    }

    const rawJsdoc = (jsdoc ?? '').trim()
    const body = content.slice(declStart, bodyEnd)
    const full = dedent(rawJsdoc ? `${rawJsdoc}\n${body}` : body).trim()
    const jsdocDedented = dedent(rawJsdoc)
    const description = extractDescription(jsdocDedented)

    exports.push({
      name,
      kind: kind as ParsedExport['kind'],
      jsdoc: jsdocDedented,
      description,
      body: dedent(body).trim(),
      full,
      file,
    })
  }

  return exports
}

const { flags, positional: query } = parseArgs()
const showAll = flags.has('--list')
const searchMode = flags.has('--search')
const membersMode = !flags.has('--no-members')

if (!query && !showAll) {
  console.error(`Usage: node ${process.argv[1]} [--list | --search | --no-members] <class-name>`)
  console.error()
  console.error('Looks up high-level types (classes, interfaces, type aliases) from the installed package.')
  console.error('  --list         Show all available types')
  console.error('  --search       Search in names and descriptions')
  console.error('  --no-members   Only show the class declaration line, not its members')
  process.exit(1)
}

const pkgDir = resolveMtcuteCoreDir()
const typesDir = join(pkgDir, 'highlevel', 'types')

// check dir exists
try {
  await stat(typesDir)
} catch {
  console.error(`Types directory not found: ${typesDir}`)
  process.exit(1)
}

const files = await collectDtsFiles(typesDir)
const allExports: ParsedExport[] = []

for (const file of files) {
  const content = await readFile(file, 'utf8')
  const exports = parseExports(content, file)
  allExports.push(...exports)
}

if (allExports.length === 0) {
  console.error('No exports found in types directory')
  process.exit(1)
}

if (showAll) {
  console.log(`${allExports.length} exports available:`)
  console.log()
  for (const e of allExports) {
    const desc = e.description ? `: ${e.description}` : ''
    console.log(`  [${e.kind}] ${e.name}${desc}`)
  }
  process.exit(0)
}

let matches: ParsedExport[]

if (searchMode) {
  const queryLower = query!.toLowerCase()
  matches = allExports.filter(e =>
    e.name.toLowerCase().includes(queryLower)
    || e.description.toLowerCase().includes(queryLower),
  )

  if (matches.length === 0) {
    console.error(`No types matching "${query}"`)
    process.exit(1)
  }

  if (matches.length > 1) {
    console.log(`${matches.length} types matching "${query}":`)
    console.log()
    for (const e of matches) {
      const desc = e.description ? `: ${e.description}` : ''
      console.log(`  [${e.kind}] ${e.name}${desc}`)
    }
    process.exit(0)
  }
} else {
  const { exact, fuzzy } = fuzzyMatch(query!, allExports, e => e.name)

  matches = exact

  if (matches.length === 0) {
    const corrected = tryAutoCorrect(query!, fuzzy)
    if (corrected) {
      matches = [corrected]
    }
  }

  if (matches.length === 0) {
    const queryLower = query!.toLowerCase()
    const nameMatches = allExports.filter(e => e.name.toLowerCase().includes(queryLower))
    const descMatches = nameMatches.length === 0
      ? allExports.filter(e => e.description.toLowerCase().includes(queryLower))
      : []
    const partial = nameMatches.length > 0 ? nameMatches : descMatches

    if (partial.length === 1) {
      console.error(`(assuming "${partial[0].name}" for "${query}")`)
      console.error()
      matches = partial
    } else if (partial.length > 0) {
      autoCorrectOrFail(query!, fuzzy, partial.map(e => `[${e.kind}] ${e.name} — ${e.description}`))
    } else {
      autoCorrectOrFail(query!, fuzzy, [])
    }
  }
}

for (const exp of matches) {
  console.log(`--- [${exp.kind}] ${exp.name} (${exp.file}) ---`)
  console.log()
  if (membersMode) {
    console.log(exp.full)
  } else {
    // just the declaration line + jsdoc
    const firstBrace = exp.body.indexOf('{')
    const declLine = firstBrace !== -1 ? exp.body.slice(0, firstBrace).trim() : exp.body.split('\n')[0]
    if (exp.jsdoc) console.log(exp.jsdoc)
    console.log(declLine)
  }
  console.log()
}
