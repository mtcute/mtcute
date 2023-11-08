import { describe, expect, it } from 'vitest'

import { memoizeGetters } from './memoize.js'

describe('memoizeGetters', () => {
    it('should memoize getters', () => {
        class Test {
            private _value = 0

            get value() {
                return this._value++
            }
        }
        memoizeGetters(Test, ['value'])

        const test = new Test()

        expect(test.value).to.equal(0)
        expect(test.value).to.equal(0)
        expect(test.value).to.equal(0)
    })

    it('should not share state across multiple instances', () => {
        class Test {
            get value() {
                return Math.random()
            }
        }

        memoizeGetters(Test, ['value'])

        const test1 = new Test()
        const test2 = new Test()

        const val = test1.value
        expect(test1.value).to.equal(val)
        expect(test2.value).to.not.equal(val)
    })

    it('should only memoize the specified getters', () => {
        class Test {
            get memoized() {
                return Math.random()
            }

            get other() {
                return Math.random()
            }
        }

        memoizeGetters(Test, ['memoized'])

        const test = new Test()

        expect(test.memoized).to.equal(test.memoized)
        expect(test.other).to.not.equal(test.other)
    })

    it('should propagate errors', () => {
        class Test {
            get value() {
                throw new Error('test')
            }
        }

        memoizeGetters(Test, ['value'])

        const test = new Test()

        expect(() => test.value).to.throw('test')
        expect(() => test.value).to.throw('test')
    })
})
