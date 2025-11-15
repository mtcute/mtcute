import type { TlEntry, TlTypeModifiers } from './types.js'

/**
 * Split qualified TL entry name into namespace and name
 *
 * @param name  Qualified TL entry name
 * @returns  Namespace (if any) and name
 * @example `splitNameToNamespace('messages.sendMessage') => ['messages', 'sendMessage']`
 * @example `splitNameToNamespace('updatesTooLong') => [null, 'updatesTooLong']`
 */
export function splitNameToNamespace(name: string): [string | null, string] {
  const s = name.split('.')
  if (s.length === 2) return s as [string, string]

  return [null, name]
}

/**
 * Parse TDLib style comment describing arguments of a TL entry
 *
 * @param str  TDLib style comment
 * @returns  Mapping of argument names to argument descriptions
 */
export function parseTdlibStyleComment(str: string): Record<string, string> {
  const obj: Record<string, string> = {}

  let pos = str.indexOf('@')

  while (pos !== -1 && pos < str.length) {
    let nameEnd = str.indexOf(' ', pos)
    if (nameEnd === -1) nameEnd = str.length

    const name = str.substring(pos + 1, nameEnd)

    pos = str.indexOf('@', nameEnd)
    obj[name] = str.substring(nameEnd + 1, pos === -1 ? undefined : pos - 1)
  }

  return obj
}

/**
 * Group TL entries by their namespace
 *
 * @param entries  Entries to group
 * @returns  Mapping of namespace to entries. Base namespace is `''` (empty string).
 */
export function groupTlEntriesByNamespace(entries: TlEntry[]): Record<string, TlEntry[]> {
  const ret: Record<string, TlEntry[]> = {}

  entries.forEach((entry) => {
    const [ns_] = splitNameToNamespace(entry.name)
    const ns = ns_ === null ? '' : ns_

    if (!(ns in ret)) ret[ns] = []
    ret[ns].push(entry)
  })

  return ret
}

export function stringifyArgumentType(type: string, modifiers?: TlTypeModifiers): string {
  if (!modifiers) return type
  let ret = type

  if (modifiers.isBareUnion) ret = `%${ret}`
  if (modifiers.isVector) ret = `Vector<${ret}>`
  else if (modifiers.isBareVector) ret = `vector<${ret}>`
  if (modifiers.predicate) ret = `${modifiers.predicate}?${ret}`

  return ret
}

export function parseArgumentType(type: string): [string, TlTypeModifiers] {
  const modifiers: TlTypeModifiers = {}
  const [predicate, type_] = type.split('?')

  if (type_) {
    modifiers.predicate = predicate
    type = type_
  }

  if (type.startsWith('Vector<')) {
    modifiers.isVector = true
    type = type.substring(7, type.length - 1)
  } else if (type.startsWith('vector<') || type.startsWith('%vector<')) {
    modifiers.isBareVector = true
    type = type.substring(7, type.length - 1)
  }

  if (type.startsWith('%')) {
    modifiers.isBareUnion = true
    type = type.substring(1)
  }

  return [type, modifiers]
}
