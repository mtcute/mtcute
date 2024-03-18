const bunTest = require('bun:test')
const console = require('console') // https://github.com/oven-sh/bun/issues/6044
const chaiExpect = require('chai').expect
const bunExpect = bunTest.expect

class BunTestUnsupportedError extends Error {
    constructor(readonly feature) {
        super()
    }
}

function _wrapBunExpect(args, bun, invert = false) {
    let chai = chaiExpect(...args)
    if (invert) chai = chai.not

    return new Proxy(bun, {
        get: (target, prop, receiver) => {
            if (prop === 'eq') return (...args) => chai.eq(...args)
            if (prop === 'eql') return (...args) => chai.eql(...args)
            if (prop === 'throws') return (...args) => chai.throws(...args)
            if (prop === 'is') return chai.is
            if (prop === 'to') return chai.to
            if (prop === 'false') return chai.false
            if (prop === 'true') return chai.true
            if (prop === 'deep') return chai.deep

            if (prop === 'toMatchInlineSnapshot') {
                return (expected, options) => {
                    let snapshot
                    if (typeof args[0] === 'string') {
                        const snapshot = '"' + args[0] + '"'
                        return chaiExpect(snapshot).eql(expected.trim())
                    } else {
                        const obj = eval('(' + expected + ')') // idc lol
                        return chaiExpect(args[0]).eql(obj)
                    }
                }
            }

            if (prop === 'not') {
                const not = bun.not
                return _wrapBunExpect(args, not, !invert)
            }

            if (prop === 'rejects') {
                if (typeof args[0] === 'function') {
                    const newArgs = [args[0](), ...args.slice(1)]
                    return _wrapBunExpect(newArgs, bunExpect(...newArgs), invert).rejects
                }

                return bun.rejects
            }
            if (prop === 'resolves') {
                return bun.resolves
            }

            if (prop === 'toHaveBeenCalledOnce' || prop === 'toHaveBeenCalledTimes' || prop === 'toMatchSnapshot') {
                throw new BunTestUnsupportedError(prop)
            }

            return Reflect.get(target, prop, receiver).bind(bun)
        },
    })
}

export function expect(...args) {
    return _wrapBunExpect(args, bunExpect(...args))
}

expect.any = bunExpect.any

const stubbedGlobal = new Map()
function stubGlobal(name, value) {
    stubbedGlobal.set(name, globalThis[name])
    globalThis[name] = value
}

function unstubAllGlobals() {
    for (const [name, value] of stubbedGlobal) {
        globalThis[name] = value
    }
    stubbedGlobal.clear()
}

const _wrapRunner = (name, fn) => {
    const handleError = (err) => {
        if (err instanceof BunTestUnsupportedError) {
            console.warn(`skipping "${name}" - ${err.feature} is currently not supported in bun:test`)
            return
        }
        throw err
    }
    return (...args) => {
        try {
            const res = fn(...args)
            if (res instanceof Promise) {
                return res.catch(handleError)
            }
            return res
        } catch (e) {
            return handleError(e)
        }
    }
}

const it = (name, fn) => bunTest.it(name, _wrapRunner(name, fn))
it.only = (name, fn) => bunTest.it.only(name, _wrapRunner(name, fn))
it.skip = (name, fn) => bunTest.it.skip(name, _wrapRunner(name, fn))
it.each = (table) => (name, fn) => bunTest.it.each(table)(name, _wrapRunner(name, fn))

export { it }

export const vi = {
    ...bunTest.jest,
    ...bunTest.vi,
    mocked: (fn) => fn,
    stubGlobal,
    unstubAllGlobals,
    ...['setSystemTime', 'advanceTimersByTimeAsync', 'advanceTimersByTime', 'waitFor', 'doMock'].reduce(
        (acc, name) => ({
            ...acc,
            [name]: () => {
                throw new BunTestUnsupportedError(name)
            },
        }),
        {},
    ),
}
