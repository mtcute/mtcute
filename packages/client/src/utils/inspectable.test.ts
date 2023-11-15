import { describe, expect, it, vi } from 'vitest'

import { makeInspectable } from './inspectable.js'

describe('makeInspectable', () => {
    // eslint-disable-next-line
    const inspect = (obj: any) => obj.toJSON()

    it('should make all getters inspectable', () => {
        class Foo {
            get foo() {
                return 1
            }
            get bar() {
                return 2
            }
        }

        makeInspectable(Foo)

        expect(inspect(new Foo())).toEqual({ foo: 1, bar: 2 })
    })

    it('should use nested classes toJSON', () => {
        class Inner {
            toJSON = vi.fn().mockReturnValue(42)
        }
        const inner = new Inner()

        class Foo {
            get foo() {
                return inner
            }
        }

        makeInspectable(Foo)

        expect(inspect(new Foo())).toEqual({ foo: 42 })
        expect(inner.toJSON).toHaveBeenCalledTimes(1)
    })

    it('should not inspect fields', () => {
        class Foo {
            get foo() {
                return 1
            }
            bar = 2
        }

        makeInspectable(Foo)

        expect(inspect(new Foo())).toEqual({ foo: 1 })
    })

    it('should inspect fields if specified', () => {
        class Foo {
            bar = 1
            baz = 2
        }

        makeInspectable(Foo, ['bar'])

        expect(inspect(new Foo())).toEqual({ bar: 1 })
    })

    it('should hide getters if specified', () => {
        class Foo {
            get foo() {
                return 1
            }
            get bar() {
                return 2
            }
        }

        makeInspectable(Foo, undefined, ['foo'])

        expect(inspect(new Foo())).toEqual({ bar: 2 })
    })

    it('should handle errors', () => {
        class Foo {
            get foo() {
                return 1
            }
            get bar() {
                throw new Error('whatever')
            }
        }

        makeInspectable(Foo)

        expect(inspect(new Foo())).toEqual({
            foo: 1,
            bar: 'Error: whatever',
        })
    })

    it('should handle Uint8Arrays', () => {
        class Foo {
            get foo() {
                return new Uint8Array([1, 2, 3])
            }
        }

        makeInspectable(Foo)

        expect(inspect(new Foo())).toEqual({
            foo: 'AQID',
        })
    })
})
