import { before } from 'mocha'
import { createTestTelegramClient } from './utils'

require('dotenv-flow').config()

async function getTestAccount(dcId = 2) {
    console.log('Preparing e2e account for dc %d...', dcId)

    const tg = createTestTelegramClient()

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

    const ret = [username, await tg.exportSession()]

    await tg.close()

    return ret
}

before(async function () {
    this.timeout(60000)

    const [username1, session1] = await getTestAccount(1)
    const [username2, session2] = await getTestAccount(2)

    process.env.USER_USERNAME = username2
    process.env.USER_SESSION = session2

    process.env.USER_OTHER_DC_USERNAME = username1
    process.env.USER_OTHER_DC_SESSION = session1
})
