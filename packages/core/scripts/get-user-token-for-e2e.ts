import { BaseTelegramClient, defaultDcs } from '../src'

require('dotenv-flow').config({ path: __dirname + '/../' })
require('debug').enable('mtcute:*')

if (!process.env.API_ID || !process.env.API_HASH) {
    console.warn('Set API_ID and API_HASH env variables')
    process.exit(0)
}

const dcId = process.argv[2] ?? '2'

const tg = new BaseTelegramClient({
    apiId: process.env.API_ID,
    apiHash: process.env.API_HASH,
    primaryDc: defaultDcs.defaultTestDc,
})

;(async () => {
    await tg.connect()

    let numbers = Math.floor(Math.random() * 9999).toString()
    while (numbers.length !== 4) numbers += '0'

    const phone = `99966${dcId}${numbers}`
    const code = `${dcId}${dcId}${dcId}${dcId}${dcId}${dcId}`

    const res = await tg.call({
        _: 'auth.sendCode',
        phoneNumber: phone,
        apiId: tg['_initConnectionParams'].apiId,
        apiHash: tg['_apiHash'],
        settings: { _: 'codeSettings' },
    })

    const res1 = await tg.call({
        _: 'auth.signIn',
        phoneNumber: phone,
        phoneCodeHash: res.phoneCodeHash,
        phoneCode: code,
    })

    if (res1._ === 'auth.authorizationSignUpRequired') {
        await tg.call({
            _: 'auth.signUp',
            phoneNumber: phone,
            phoneCodeHash: res.phoneCodeHash,
            firstName: 'MTCute E2E',
            lastName: '',
        })
    }

    const username = `mtcute_e2e_${numbers}`

    await tg.call({
        _: 'account.updateUsername',
        username,
    })

    console.log('User %s, DC %d: %s', username, dcId, await tg.exportSession())
})().catch(console.error)
