import { MtUnsupportedError } from '../../../types/errors.js'

export function downloadToFile() {
    throw new MtUnsupportedError('Downloading to file is only supported in NodeJS')
}
