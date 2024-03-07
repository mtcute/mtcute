/* eslint-disable no-console */
const { execSync } = require('child_process')
const fs = require('fs')

const VERSION = '2.19.20'
const TMP_DIR = '/tmp/gramjs'

async function main() {
    if (!fs.existsSync(TMP_DIR)) {
        execSync(`mkdir -p ${TMP_DIR}`)
        execSync(`npm install telegram@${VERSION}`, {
            cwd: TMP_DIR,
            stdio: 'inherit',
        })
        console.log('Installed gramjs')
    }

    // crutches for webpack
    const gramjs = require(`${TMP_DIR}/node_modules/telegram`)

    const apiId = Number(process.env.API_ID)
    const apiHash = process.env.API_HASH
    const stringSession = new gramjs.sessions.StringSession('')
    stringSession.setDC(2, '149.154.167.40', 443)

    const client = new gramjs.TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    })

    await client.start({
        phoneNumber: async () => '9996621234',
        phoneCode: async () => '22222',
        onError: console.error,
    })

    const session = stringSession.save()

    fs.writeFileSync(
        `${__dirname}/session.ts`,
        `export const GRAMJS_SESSION = '${session}'\n`,
    )

    await client.destroy()
}

main().catch(console.error)
