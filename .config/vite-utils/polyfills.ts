export function setupChai(chai: any, vitestExpect: any) {
    chai.use(vitestExpect.JestExtend)
    chai.use(vitestExpect.JestChaiExpect)
    chai.use(vitestExpect.JestAsymmetricMatchers)
    chai.use((chai: any, utils: any) => {
        utils.addMethod(
            chai.Assertion.prototype,
            'toMatchInlineSnapshot',
            function (properties?: object, inlineSnapshot?: string, message?: string) {
                // based on https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/integrations/snapshot/chai.ts

                const received = utils.flag(this, 'object')
                if (typeof properties === 'string') {
                    message = inlineSnapshot
                    inlineSnapshot = properties
                    properties = undefined
                }

                if (typeof inlineSnapshot !== 'string') {
                    throw new Error('toMatchInlineSnapshot requires a string argument')
                }

                // todo use @vitest/snapshot
                if (typeof received === 'string') {
                    const snapshot = '"' + received + '"'
                    return chai.expect(snapshot).eql(inlineSnapshot.trim())
                } else {
                    const obj = eval('(' + inlineSnapshot + ')') // idc lol
                    return chai.expect(received).eql(obj)
                }
            },
        )

        utils.addMethod(chai.Assertion.prototype, 'toMatchSnapshot', function () {
            // todo use @vitest/snapshot
        })
    })

    vitestExpect.setState(
        {
            assertionCalls: 0,
            isExpectingAssertions: false,
            isExpectingAssertionsError: null,
            expectedAssertionsNumber: null,
            expectedAssertionsNumberErrorGen: null,
            environment: 'deno',
            testPath: 'deno-test.ts',
            currentTestName: 'deno-test',
        },
        chai.expect,
    )
    Object.defineProperty(globalThis, vitestExpect.GLOBAL_EXPECT, {
        value: chai.expect,
        writable: true,
        configurable: true,
    })
}

const stubbedGlobal = new Map()
export function stubGlobal(name: string, value: any) {
    stubbedGlobal.set(name, globalThis[name])
    globalThis[name] = value
}

export function unstubAllGlobals() {
    for (const [name, value] of stubbedGlobal) {
        globalThis[name] = value
    }
    stubbedGlobal.clear()
}

export async function waitFor(fn: Function) {
    // less customizations than vi.waitFor but it's good enough for now
    const timeout = Date.now() + 5000

    let lastError: unknown
    while (Date.now() < timeout) {
        try {
            return await fn()
        } catch (e) {
            lastError = e
            await new Promise((resolve) => setTimeout(resolve, 10))
        }
    }

    throw lastError
}
