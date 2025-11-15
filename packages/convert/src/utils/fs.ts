export interface INodeFsLike {
  readFile(path: string): Promise<Uint8Array>
  writeFile(path: string, data: Uint8Array): Promise<void>
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>
  stat(path: string): Promise<{ size: number, lastModified: number }>
}

export function dirname(path: string): string {
  return path.replace(/[/\\][^/\\]*$/, '')
}

export function basename(path: string): string {
  return path.replace(/^.*[/\\]/, '')
}

export function joinPaths(...paths: string[]): string {
  const parts: string[] = []
  let guessedSep: string | undefined

  for (const path of paths) {
    if (!guessedSep) {
      guessedSep = path.match(/[/\\]/)?.[0]
    }

    for (const segment of path.split(/[/\\]/)) {
      if (segment === '.') continue
      if (segment === '..' && parts.length !== 0) {
        parts.pop()
        continue
      }
      if (segment === '' && parts.length !== 0) {
        continue
      }

      parts.push(segment)
    }
  }

  return parts.join(guessedSep ?? '/')
}
