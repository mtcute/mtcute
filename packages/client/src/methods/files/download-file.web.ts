import { MtUnsupportedError } from '@mtcute/core'

export function downloadToFile() {
    throw new MtUnsupportedError('Downloading to file is only supported in NodeJS')
}
