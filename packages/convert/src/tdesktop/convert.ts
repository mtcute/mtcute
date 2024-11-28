import { type StringSessionData, readStringSession } from '@mtcute/core/utils.js'
import type { MaybeArray } from '@fuman/utils'
import { Long } from '@mtcute/core'

import { DC_MAPPING_PROD } from '../dcs.js'

import type { TdataOptions } from './tdata.js'
import { Tdata } from './tdata.js'
import type { InputTdKeyData } from './types.js'

export async function convertFromTdata(tdata: Tdata | TdataOptions, accountIdx = 0): Promise<StringSessionData> {
    if (!(tdata instanceof Tdata)) {
        tdata = await Tdata.open(tdata)
    }

    const auth = await tdata.readMtpAuthorization(accountIdx)
    const authKey = auth.authKeys.find(it => it.dcId === auth.mainDcId)
    if (!authKey) throw new Error('Failed to find auth key')

    return {
        version: 3,
        primaryDcs: DC_MAPPING_PROD[auth.mainDcId],
        authKey: authKey.key,
        self: {
            userId: auth.userId.toNumber(),
            isBot: false,
            isPremium: false,
            usernames: [],
        },
    }
}

export async function convertToTdata(
    sessions: MaybeArray<StringSessionData | string>,
    tdata: Tdata | TdataOptions,
): Promise<void> {
    if (!Array.isArray(sessions)) {
        sessions = [sessions]
    }

    if (!(tdata instanceof Tdata)) {
        const keyData: InputTdKeyData = {
            count: sessions.length,
            order: Array.from({ length: sessions.length }, (_, i) => i),
            active: 0,
        }
        tdata = await Tdata.create({
            keyData,
            ...tdata,
        })
    }

    for (let i = 0; i < sessions.length; i++) {
        let session = sessions[i]

        if (typeof session === 'string') {
            session = readStringSession(session)
        }

        await tdata.writeMtpAuthorization({
            userId: Long.fromNumber(session.self?.userId ?? 0),
            mainDcId: session.primaryDcs.main.id,
            authKeys: [
                {
                    dcId: session.primaryDcs.main.id,
                    key: session.authKey,
                },
            ],
            authKeysToDestroy: [],
        }, i)
        await tdata.writeEmptyMapFile(i)
    }
}
