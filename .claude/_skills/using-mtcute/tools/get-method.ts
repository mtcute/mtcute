import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { autoCorrectOrFail, fuzzyMatch, parseArgs, resolveMtcuteCoreDir, tryAutoCorrect } from './_utils.js'

interface ParsedMethod {
  name: string
  jsdoc: string
  signature: string
  full: string
  description: string
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

function parseClientDts(content: string): ParsedMethod[] {
  const methods: ParsedMethod[] = []

  // find the interface body: `export interface TelegramClient extends ITelegramClient {`
  const ifaceStart = content.indexOf('export interface TelegramClient extends ITelegramClient {')
  if (ifaceStart === -1) return methods

  const body = content.slice(ifaceStart)

  // match each method: optional jsdoc + method signature
  // jsdoc starts with /**, ends with */ (non-greedy, but must not span multiple comment blocks)
  // signature is indented methodName(...): ReturnType;
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const methodRe = /(?<jsdoc>[ \t]*\/\*\*(?:(?!\*\/)[\s\S])*?\*\/\s*)?(?<signature>[ \t]*(?<name>\w+)(?:<[^>]+>)?\([\s\S]*?\): [^;]+;)/g

  let match: RegExpExecArray | null
  while ((match = methodRe.exec(body)) !== null) {
    const { jsdoc, signature, name } = match.groups!

    // stop if we've left the interface (hit the closing brace at column 0)
    const preceding = body.slice(0, match.index)
    const lastNewline = preceding.lastIndexOf('\n')
    const lineStart = preceding.slice(lastNewline + 1)
    if (lineStart === '}') break

    // skip private/internal methods
    if (name.startsWith('_')) continue

    const raw = `${jsdoc ?? ''}${signature}`
    const full = dedent(raw).trim()
    const jsdocDedented = dedent((jsdoc ?? '').trim())
    const desc = extractDescription(jsdocDedented)

    methods.push({
      name,
      jsdoc: jsdocDedented,
      signature: dedent(signature).trim(),
      full,
      description: desc,
    })
  }

  return methods
}

const { flags, positional: query } = parseArgs()
const showAll = flags.has('--list')
const searchMode = flags.has('--search')

if (!query && !showAll) {
  console.error(`Usage: node ${process.argv[1]} [--list | --search] <method-name>`)
  console.error()
  console.error('Looks up high-level TelegramClient method signatures from the installed package.')
  console.error('Use --list to show all available methods, --search to search in descriptions.')
  process.exit(1)
}

const pkgDir = resolveMtcuteCoreDir()
const clientDtsPath = join(pkgDir, 'highlevel', 'client.d.ts')
const content = await readFile(clientDtsPath, 'utf8')
const methods = parseClientDts(content)

if (methods.length === 0) {
  console.error(`Could not parse any methods from ${clientDtsPath}`)
  process.exit(1)
}

if (showAll) {
  console.log(`${methods.length} methods available:`)
  console.log()
  for (const m of methods) {
    console.log(`  ${m.name}: ${m.description}`)
  }
  process.exit(0)
}

let matches: ParsedMethod[]

if (searchMode) {
  const queryLower = query!.toLowerCase()
  matches = methods.filter(m =>
    m.name.toLowerCase().includes(queryLower)
    || m.description.toLowerCase().includes(queryLower),
  )

  if (matches.length === 0) {
    console.error(`No methods matching "${query}"`)
    process.exit(1)
  }

  if (matches.length > 1) {
    console.log(`${matches.length} methods matching "${query}":`)
    console.log()
    for (const m of matches) {
      console.log(`  ${m.name}: ${m.description}`)
    }
    process.exit(0)
  }
} else {
  const { exact, fuzzy } = fuzzyMatch(query!, methods, m => m.name)

  matches = exact

  if (matches.length === 0) {
    const corrected = tryAutoCorrect(query!, fuzzy)
    if (corrected) {
      matches = [corrected]
    }
  }

  // try substring match in names and descriptions
  if (matches.length === 0) {
    const queryLower = query!.toLowerCase()
    const nameMatches = methods.filter(m => m.name.toLowerCase().includes(queryLower))
    const descMatches = nameMatches.length === 0
      ? methods.filter(m => m.description.toLowerCase().includes(queryLower))
      : []
    const partial = nameMatches.length > 0 ? nameMatches : descMatches

    if (partial.length === 1) {
      console.error(`(assuming "${partial[0].name}" for "${query}")`)
      console.error()
      matches = partial
    } else if (partial.length > 0) {
      autoCorrectOrFail(query!, fuzzy, partial.map(m => `${m.name} — ${m.description}`))
    } else {
      autoCorrectOrFail(query!, fuzzy, [])
    }
  }
}

for (const method of matches) {
  console.log(`--- ${method.name} (${clientDtsPath}) ---`)
  console.log()
  console.log(method.full)
  console.log()
}
