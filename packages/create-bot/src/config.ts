import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import * as path from 'node:path'
import process from 'node:process'

export interface UserConfigPersisted {
  apiId: number
  apiHash: string
}

export function getConfigFilePath(): string {
  switch (process.platform) {
    case 'linux':
      return path.join(homedir(), '.local', 'share', 'mtcute-create.json')
    case 'darwin':
      return path.join(homedir(), 'Library', 'Application Support', 'mtcute-create.json')
    case 'win32':
      return path.join(process.env.APPDATA!, 'mtcute-create.json')
  }

  throw new Error(`Unsupported platform: ${process.platform}`)
}

export async function readConfig(): Promise<UserConfigPersisted | null> {
  const filePath = getConfigFilePath()

  try {
    const data = await fs.readFile(filePath, 'utf8')

    return JSON.parse(data) as UserConfigPersisted
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT') return null

    throw e
  }
}

export async function writeConfig(config: UserConfigPersisted): Promise<void> {
  const filePath = getConfigFilePath()

  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(config, null, 2))
}
