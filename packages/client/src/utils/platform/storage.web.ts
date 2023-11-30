import { IdbStorage } from '@mtcute/core/src/storage/idb.js'

import { MtUnsupportedError } from '../../index.js'

/** @internal */
export const _defaultStorageFactory = (name: string) => {
    if (typeof indexedDB !== 'undefined') {
        return new IdbStorage(name)
    }

    throw new MtUnsupportedError('No storage available!')
}
