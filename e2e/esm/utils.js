import { MemoryStorage } from '@mtcute/core/storage/memory.js'

export const getApiParams = () => {
    if (!process.env.API_ID || !process.env.API_HASH) {
        throw new Error('API_ID and API_HASH env variables must be set')
    }

    return {
        apiId: parseInt(process.env.API_ID),
        apiHash: process.env.API_HASH,
        testMode: true,
        storage: new MemoryStorage(),
    }
}
