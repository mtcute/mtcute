import { MtArgumentError } from '@mtcute/core'
import { getPlatform } from '@mtcute/core/platform.js'
import { TlBinaryReader } from '@mtcute/core/utils.js'

import { telegramRleDecode } from '../utils/rle.js'

import type { MtkrutoSession } from './types.js'

export function parseMtkrutoSession(session: string): MtkrutoSession {
    const data = telegramRleDecode(getPlatform().base64Decode(session, true))
    const reader = TlBinaryReader.manual(data)

    let dcIdStr = reader.string()
    const authKey = reader.bytes()

    const isTest = dcIdStr.endsWith('-test')

    if (isTest) {
        dcIdStr = dcIdStr.slice(0, -5)
    }
    const dcId = Number(dcIdStr)

    if (Number.isNaN(dcId)) {
        throw new MtArgumentError(`Invalid DC ID: ${dcIdStr}`)
    }

    return {
        dcId,
        isTest,
        authKey,
    }
}
