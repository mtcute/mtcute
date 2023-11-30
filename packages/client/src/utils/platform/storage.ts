import { JsonFileStorage } from '@mtcute/core/src/storage/json-file.js'

/** @internal */
export const _defaultStorageFactory = (name: string) => {
    return new JsonFileStorage(name)
}
