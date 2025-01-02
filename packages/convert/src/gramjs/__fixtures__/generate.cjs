const { execSync } = require('node:child_process')
const fs = require('node:fs')
const readline = require('node:readline/promises')

const VERSION = '2.26.16'
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

    const gramjs = require(`${TMP_DIR}/node_modules/telegram`)
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    const apiId = Number(process.env.API_ID)
    const apiHash = process.env.API_HASH
    const stringSession = new gramjs.sessions.StringSession('')
    stringSession.setDC(2, '149.154.167.40', 443)

    const client = new gramjs.TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    })

    await client.start({
        phoneNumber: async () => (await rl.question('phone number > ')).trim(),
        phoneCode: async () => (await rl.question('phone code > ')).trim(),
        password: async () => (await rl.question('2fa password > ')).trim(),
        onError: console.error,
    })

    const session = stringSession.save()

    fs.writeFileSync(
        // eslint-disable-next-line node/no-path-concat
        `${__dirname}/session.ts`,
        `export const GRAMJS_SESSION = '${session}'\n`,
    )

    await client.destroy()

    // eslint-disable-next-line node/no-path-concat
    const storeSession = new gramjs.sessions.StoreSession('store-session')
    storeSession.setDC(2, '149.154.167.40', 443)

    // i *think* (?) there isn't a way to import a string session into a store session?? whatever lets just log in again lol
    const client2 = new gramjs.TelegramClient(storeSession, apiId, apiHash, {
        connectionRetries: 5,
    })

    await client2.start({
        phoneNumber: async () => (await rl.question('phone number > ')).trim(),
        phoneCode: async () => (await rl.question('phone code > ')).trim(),
        password: async () => (await rl.question('2fa password > ')).trim(),
        onError: console.error,
    })

    await client2.destroy()
}

main().catch(console.error)
