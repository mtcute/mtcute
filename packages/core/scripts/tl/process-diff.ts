// Reads diff.json and prints a human/agent-friendly summary of changes
// Usage: tsx scripts/process-diff.ts

import type {
  BasicDiff,
  TlArgument,
  TlArgumentDiff,
  TlEntry,
  TlEntryDiff,
  TlSchemaDiff,
} from '@mtcute/tl-utils'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { stringifyArgumentType, writeTlEntryToString } from '@mtcute/tl-utils'

import { __dirname } from './constants.js'

function fmtArgType(arg: TlArgument): string {
  return stringifyArgumentType(arg.type, arg.typeModifiers)
}

const DIFF_FILE = join(__dirname, 'diff.json')

interface DiffJson {
  layer: [number, number]
  diff: TlSchemaDiff
}

function printEntries(label: string, entries: TlEntry[]): void {
  if (!entries.length) return
  console.log(`${label}:`)
  for (const e of entries) {
    console.log(`  ${writeTlEntryToString(e)}`)
  }
  console.log('')
}

function describeArgDiff(arg: TlArgumentDiff): string {
  return `${arg.name}:${arg.type!.old} -> ${arg.name}:${arg.type!.new}`
}

function hasNonCommentChanges(e: TlEntryDiff): boolean {
  if (e.generics) return true
  if (!e.arguments) return false
  return e.arguments.added.length > 0 || e.arguments.removed.length > 0 || e.arguments.modified.some(a => a.type)
}

function printModified(label: string, entries: TlEntryDiff[]): void {
  const filtered = entries.filter(hasNonCommentChanges)
  if (!filtered.length) return
  console.log(`${label}:`)
  for (const e of filtered) {
    const parts: string[] = []
    if (e.arguments) {
      for (const a of e.arguments.added) {
        parts.push(`ADDED ${a.name}:${fmtArgType(a)}`)
      }
      for (const a of e.arguments.removed) {
        parts.push(`REMOVED ${a.name}:${fmtArgType(a)}`)
      }
      for (const a of e.arguments.modified) {
        if (!a.type) continue // ignore comment-only changes
        parts.push(`CHANGED ${describeArgDiff(a)}`)
      }
    }
    if (e.generics) parts.push('generics changed')
    if (!parts.length) continue // ignore comment-only changes
    console.log(`  ${e.name}: ${parts.join('; ')}`)
  }
  console.log('')
}

function collectLongFields(diff: TlSchemaDiff): { entry: string, arg: string, type: string }[] {
  const results: { entry: string, arg: string, type: string }[] = []

  function scanAdded(entries: TlEntry[]): void {
    for (const e of entries) {
      for (const a of e.arguments) {
        if (a.type === 'long' || a.type.toLowerCase() === 'vector<long>') {
          results.push({ entry: e.name, arg: a.name, type: a.type })
        }
      }
    }
  }

  function scanModified(entries: TlEntryDiff[]): void {
    for (const e of entries) {
      if (!e.arguments) continue
      for (const a of e.arguments.added) {
        if (a.type === 'long' || a.type.toLowerCase() === 'vector<long>') {
          results.push({ entry: e.name, arg: a.name, type: a.type })
        }
      }
    }
  }

  scanAdded(diff.classes.added)
  scanAdded(diff.methods.added)
  scanModified(diff.classes.modified)
  scanModified(diff.methods.modified)

  return results
}

function printSection(title: string, diff: BasicDiff<TlEntry, TlEntryDiff>): void {
  printEntries(`ADDED ${title}`, diff.added)
  printEntries(`REMOVED ${title}`, diff.removed)
  printModified(`MODIFIED ${title}`, diff.modified)
}

async function main(): Promise<void> {
  const raw = JSON.parse(await readFile(DIFF_FILE, 'utf8')) as DiffJson
  const { layer, diff } = raw

  console.log(`LAYER: ${layer[0]} -> ${layer[1]}`)
  console.log('')

  printSection('CLASSES', diff.classes)
  printSection('METHODS', diff.methods)

  const longFields = collectLongFields(diff)
  if (longFields.length) {
    console.log('LONG FIELDS (may need int53 override):')
    for (const f of longFields) {
      console.log(`  ${f.entry}#${f.arg}: ${f.type}`)
    }
    console.log('')
    console.log('To override, add entries to packages/core/src/tl/data/int53-overrides.json')
  } else {
    console.log('LONG FIELDS: none')
  }
}

main().catch(console.error)
