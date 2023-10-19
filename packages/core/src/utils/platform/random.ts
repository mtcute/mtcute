// eslint-disable-next-line no-restricted-imports
import { randomBytes } from 'crypto'

export const _randomBytes = randomBytes as (size: number) => Uint8Array
