import chalk from 'chalk'
import * as cp from 'child_process'

export function exec(cwd: string, ...cmd: string[]) {
    return new Promise<void>((resolve, reject) => {
        console.log(`${chalk.blue('$')} ${cmd.join(' ')}`)

        const proc = cp.spawn(cmd[0], cmd.slice(1), {
            stdio: 'inherit',
            cwd,
        })

        proc.on('close', (code) => {
            if (code === 0) {
                resolve()
            } else {
                reject(new Error(`Process "${cmd.join(' ')}" exited with code ${code}`))
            }
        })
    })
}
