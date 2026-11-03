import * as colors from 'colorette'
import { spawn } from 'cross-spawn'

import { getPlatform } from './config.js'

const OPEN_COMMANDS: {
  [key: string]: string
} = {
  darwin: 'open',
  win32: 'explorer.exe',
  linux: 'xdg-open',
}

export function exec(cwd: string, ...cmd: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    console.log(`${colors.blue('$')} ${cmd.map(it => (it.includes(' ') ? JSON.stringify(it) : it)).join(' ')}`)

    const proc = spawn(cmd[0], cmd.slice(1), {
      stdio: 'inherit',
      cwd,
    })

    proc.on('error', reject)

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Process "${cmd.join(' ')}" exited with code ${code}`))
      }
    })
  })
}

export function open(url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const command = OPEN_COMMANDS[getPlatform()]
    if (!command) {
      console.log(getPlatform())
      return reject(new Error(`Unsupported platform: ${getPlatform()}`))
    }

    const proc = spawn(command, [url], {
      stdio: 'inherit',
    })

    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Failed to open "${url}"`))
      }
    })
  })
}
