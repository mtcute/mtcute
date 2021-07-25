import { MtqtTypeAssertionError } from '../types'
import { tl } from '@mtqt/tl'

export function assertTypeIs<T extends tl.TlObject, K extends T['_']>(
    context: string,
    obj: T,
    expected: K
): asserts obj is tl.FindByName<T, K> {
    if (obj._ !== expected) {
        throw new MtqtTypeAssertionError(context, expected, obj._)
    }
}
