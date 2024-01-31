import { IdbStorage } from '../../../storage/index.js'
import { MtUnsupportedError } from '../../../types/errors.js'

/** @internal */
export const _defaultStorageFactory = (name: string) => {
    if (typeof indexedDB !== 'undefined') {
        return new IdbStorage(name)
    }

    throw new MtUnsupportedError('No storage available!')
}
