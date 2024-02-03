import { MtUnsupportedError } from '../../../types/errors.js'
import { ITelegramStorageProvider } from '../../storage/provider.js'

/** @internal */
export const _defaultStorageFactory = (_name: string): ITelegramStorageProvider => {
    throw new MtUnsupportedError('Please provide a storage explicitly (e.g. @mtcute/sqlite)')
}
