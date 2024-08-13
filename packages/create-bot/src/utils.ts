import * as colors from 'colorette'
import { spawn } from 'cross-spawn'

export function exec(cwd: string, ...cmd: string[]) {
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
