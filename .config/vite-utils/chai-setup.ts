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
