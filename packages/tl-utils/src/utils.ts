import { TlEntry } from './types'

export function splitNameToNamespace(name: string): [string | null, string] {
    const s = name.split('.')
    if (s.length === 2) return s as [string, string]
    return [null, name]
}


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
