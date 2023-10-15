import type { BaseTelegramClientOptions } from '@mtcute/core'

export const getApiParams = (): BaseTelegramClientOptions => {
    if (!process.env.API_ID || !process.env.API_HASH) {
        throw new Error('API_ID and API_HASH env variables must be set')
    }

    return {
        apiId: parseInt(process.env.API_ID),
        apiHash: process.env.API_HASH,
        testMode: true,
    }
}
