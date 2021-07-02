import { describe, it } from 'mocha'
import { expect } from 'chai'
import { tl } from '@mtcute/tl'
import { HtmlMessageEntityParser, html } from '../src'
import { MessageEntity, RawString } from '@mtcute/client'
import bigInt from 'big-integer'

const createEntity = <T extends tl.TypeMessageEntity['_']>(
    type: T,
    offset: number,
    length: number,
    additional?: Omit<
        tl.FindByName<tl.TypeMessageEntity, T>,
        '_' | 'offset' | 'length'
    >
): tl.TypeMessageEntity => {
    return {
        _: type,
        offset,
        length,
        ...(additional ?? {}),
    } as any // idc really, its not that important
}

const createEntities = (entities: tl.TypeMessageEntity[]): MessageEntity[] => {
    return entities
        .map((it) => MessageEntity._parse(it))
        .filter((it) => it !== null) as MessageEntity[]
}

describe('HtmlMessageEntityParser', () => {
    const parser = new HtmlMessageEntityParser()

    describe('unparse', () => {
        const test = (
            text: string,
            entities: tl.TypeMessageEntity[],
            expected: string,
            _parser = parser
        ): void => {
            expect(_parser.unparse(text, createEntities(entities))).eq(expected)
        }

        it('should return the same text if there are no entities or text', () => {
            test('', [], '')
            test('some text', [], 'some text')
        })

        it('should handle <b>, <i>, <u>, <s> tags', () => {
            test(
                'plain bold italic underline strikethrough plain',
                [
                    createEntity('messageEntityBold', 6, 4),
                    createEntity('messageEntityItalic', 11, 6),
                    createEntity('messageEntityUnderline', 18, 9),
                    createEntity('messageEntityStrike', 28, 13),
                ],
                'plain <b>bold</b> <i>italic</i> <u>underline</u> <s>strikethrough</s> plain'
            )
        })

        it('should handle <code>, <pre>, <blockquote> tags', () => {
            test(
                'plain code pre blockquote plain',
                [
                    createEntity('messageEntityCode', 6, 4),
                    createEntity('messageEntityPre', 11, 3),
                    createEntity('messageEntityBlockquote', 15, 10),
                ],
                'plain <code>code</code> <pre>pre</pre> <blockquote>blockquote</blockquote> plain'
            )
        })

        it('should handle links and text mentions', () => {
            test(
                'plain https://google.com google @durov Pavel Durov mail@mail.ru plain',
                [
                    createEntity('messageEntityUrl', 6, 18),
                    createEntity('messageEntityTextUrl', 25, 6, {
                        url: 'https://google.com',
                    }),
                    createEntity('messageEntityMention', 32, 6),
                    createEntity('messageEntityMentionName', 39, 11, {
                        userId: 36265675,
                    }),
                    createEntity('messageEntityEmail', 51, 12),
                ],
                'plain <a href="https://google.com">https://google.com</a> <a href="https://google.com">google</a> @durov <a href="tg://user?id=36265675">Pavel Durov</a> <a href="mailto:mail@mail.ru">mail@mail.ru</a> plain'
            )
        })

        it('should handle language in <pre>', () => {
            test(
                'plain console.log("Hello, world!") some code plain',
                [
                    createEntity('messageEntityPre', 6, 28, {
                        language: 'javascript',
                    }),
                    createEntity('messageEntityPre', 35, 9, { language: '' }),
                ],
                'plain <pre language="javascript">console.log("Hello, world!")</pre> <pre>some code</pre> plain'
            )
        })

        it('should support entities on the edges', () => {
            test(
                'Hello, world',
                [
                    createEntity('messageEntityBold', 0, 5),
                    createEntity('messageEntityBold', 7, 5),
                ],
                '<b>Hello</b>, <b>world</b>'
            )
        })

        it('should clamp out-of-range entities', () => {
            test(
                'Hello, world',
                [
                    createEntity('messageEntityBold', -2, 7),
                    createEntity('messageEntityBold', 7, 10),
                ],
                '<b>Hello</b>, <b>world</b>'
            )
        })

        it('should ignore entities outside the length', () => {
            test(
                'Hello, world',
                [createEntity('messageEntityBold', 50, 5)],
                'Hello, world'
            )
        })

        it('should support entities followed by each other', () => {
            test(
                'plain Hello, world plain',
                [
                    createEntity('messageEntityBold', 6, 6),
                    createEntity('messageEntityItalic', 12, 6),
                ],
                'plain <b>Hello,</b><i> world</i> plain'
            )
        })

        it('should support nested entities', () => {
            test(
                'Welcome to the gym zone!',
                [
                    createEntity('messageEntityItalic', 0, 24),
                    createEntity('messageEntityBold', 15, 8),
                ],
                '<i>Welcome to the <b>gym zone</b>!</i>'
            )
        })

        it('should support nested entities with the same edges', () => {
            test(
                'Welcome to the gym zone!',
                [
                    createEntity('messageEntityItalic', 0, 24),
                    createEntity('messageEntityBold', 15, 9),
                ],
                '<i>Welcome to the <b>gym zone!</b></i>'
            )
            test(
                'Welcome to the gym zone!',
                [
                    createEntity('messageEntityBold', 0, 24),
                    createEntity('messageEntityItalic', 15, 9),
                ],
                '<b>Welcome to the <i>gym zone!</i></b>'
            )
            test(
                'Welcome to the gym zone!',
                [
                    createEntity('messageEntityItalic', 0, 24),
                    createEntity('messageEntityBold', 0, 7),
                ],
                '<i><b>Welcome</b> to the gym zone!</i>'
            )
            test(
                'Welcome to the gym zone!',
                [
                    createEntity('messageEntityItalic', 0, 24),
                    createEntity('messageEntityBold', 0, 24),
                ],
                '<i><b>Welcome to the gym zone!</b></i>'
            )
        })

        it('should support overlapping entities', () => {
            test(
                'Welcome to the gym zone!',
                [
                    createEntity('messageEntityItalic', 0, 14),
                    createEntity('messageEntityBold', 8, 10),
                ],
                '<i>Welcome <b>to the</b></i><b> gym</b> zone!'
            )
            test(
                'plain bold bold-italic bold-italic-underline underline plain',
                [
                    createEntity('messageEntityBold', 6, 38),
                    createEntity('messageEntityItalic', 11, 33),
                    createEntity('messageEntityUnderline', 23, 31),
                ],
                'plain <b>bold <i>bold-italic <u>bold-italic-underline</u></i></b><u> underline</u> plain'
            )
            test(
                'plain bold bold-italic bold-italic-underline italic-underline underline plain',
                [
                    createEntity('messageEntityBold', 6, 38),
                    createEntity('messageEntityItalic', 11, 50),
                    createEntity('messageEntityUnderline', 23, 48),
                ],
                // not the most efficient way (in the second part we could do <u><i>...</i>...</u>), but whatever
                'plain <b>bold <i>bold-italic <u>bold-italic-underline</u></i></b><i><u> italic-underline</u></i><u> underline</u> plain'
            )
        })

        it('should properly handle emojis', () => {
            test(
                "best flower: 🌸. don't you even doubt it.",
                [
                    createEntity('messageEntityItalic', 0, 11),
                    createEntity('messageEntityBold', 13, 2),
                    createEntity('messageEntityItalic', 17, 5),
                ],
                "<i>best flower</i>: <b>🌸</b>. <i>don't</i> you even doubt it."
            )
        })

        it('should escape special symbols', () => {
            test(
                '<&> < & > <&>',
                [createEntity('messageEntityBold', 4, 5)],
                '&lt;&amp;&gt; <b>&lt; &amp; &gt;</b> &lt;&amp;&gt;'
            )
        })

        it('should work with custom syntax highlighter', () => {
            const parser = new HtmlMessageEntityParser({
                syntaxHighlighter: (code, lang) =>
                    `lang: <b>${lang}</b><br>${code}`,
            })

            test(
                'plain console.log("Hello, world!") some code plain',
                [
                    createEntity('messageEntityPre', 6, 28, {
                        language: 'javascript',
                    }),
                    createEntity('messageEntityPre', 35, 9, { language: '' }),
                ],
                'plain <pre language="javascript">lang: <b>javascript</b><br>console.log("Hello, world!")</pre> <pre>lang: <b></b><br>some code</pre> plain',
                parser
            )
        })
    })

    describe('parse', () => {
        const test = (
            text: string,
            expectedEntities: tl.TypeMessageEntity[],
            expectedText: string
        ): void => {
            const [_text, entities] = parser.parse(text)
            expect(_text).eql(expectedText)
            expect(entities).eql(expectedEntities)
        }

        it('should handle <b>, <i>, <u>, <s> tags', () => {
            test(
                'plain <b>bold</b> <i>italic</i> <u>underline</u> <s>strikethrough</s> plain',
                [
                    createEntity('messageEntityBold', 6, 4),
                    createEntity('messageEntityItalic', 11, 6),
                    createEntity('messageEntityUnderline', 18, 9),
                    createEntity('messageEntityStrike', 28, 13),
                ],
                'plain bold italic underline strikethrough plain'
            )
        })

        it('should handle <code>, <pre>, <blockquote> tags', () => {
            test(
                'plain <code>code</code> <pre>pre</pre> <blockquote>blockquote</blockquote> plain',
                [
                    createEntity('messageEntityCode', 6, 4),
                    createEntity('messageEntityPre', 11, 3, { language: '' }),
                    createEntity('messageEntityBlockquote', 15, 10),
                ],
                'plain code pre blockquote plain'
            )
        })

        it('should handle links and text mentions', () => {
            test(
                'plain https://google.com <a href="https://google.com">google</a> @durov <a href="tg://user?id=36265675">Pavel Durov</a> plain',
                [
                    createEntity('messageEntityTextUrl', 25, 6, {
                        url: 'https://google.com',
                    }),
                    createEntity('messageEntityMentionName', 39, 11, {
                        userId: 36265675,
                    }),
                ],
                'plain https://google.com google @durov Pavel Durov plain'
            )

            test(
                '<a href="tg://user?id=1234567&hash=aabbccddaabbccdd">user</a>',
                [
                    createEntity('inputMessageEntityMentionName', 0, 4, {
                        userId: {
                            _: 'inputUser',
                            userId: 1234567,
                            accessHash: bigInt('aabbccddaabbccdd', 16),
                        },
                    }),
                ],
                'user'
            )
        })

        it('should handle language in <pre>', () => {
            test(
                'plain <pre language="javascript">console.log("Hello, world!")</pre> <pre>some code</pre> plain',
                [
                    createEntity('messageEntityPre', 6, 28, {
                        language: 'javascript',
                    }),
                    createEntity('messageEntityPre', 35, 9, { language: '' }),
                ],
                'plain console.log("Hello, world!") some code plain'
            )
        })

        it('should support entities on the edges', () => {
            test(
                '<b>Hello</b>, <b>world</b>',
                [
                    createEntity('messageEntityBold', 0, 5),
                    createEntity('messageEntityBold', 7, 5),
                ],
                'Hello, world'
            )
        })

        it('should return empty array if there are no entities', () => {
            test('Hello, world', [], 'Hello, world')
        })

        it('should support entities followed by each other', () => {
            test(
                'plain <b>Hello,</b><i> world</i> plain',
                [
                    createEntity('messageEntityBold', 6, 6),
                    createEntity('messageEntityItalic', 12, 6),
                ],
                'plain Hello, world plain'
            )
        })

        it('should support nested entities', () => {
            test(
                '<i>Welcome to the <b>gym zone</b>!</i>',
                [
                    createEntity('messageEntityBold', 15, 8),
                    createEntity('messageEntityItalic', 0, 24),
                ],
                'Welcome to the gym zone!'
            )
        })

        it('should support nested entities with the same edges', () => {
            test(
                '<i>Welcome to the <b>gym zone!</b></i>',
                [
                    createEntity('messageEntityBold', 15, 9),
                    createEntity('messageEntityItalic', 0, 24),
                ],
                'Welcome to the gym zone!'
            )
            test(
                '<b>Welcome to the <i>gym zone!</i></b>',
                [
                    createEntity('messageEntityItalic', 15, 9),
                    createEntity('messageEntityBold', 0, 24),
                ],
                'Welcome to the gym zone!'
            )
            test(
                '<i><b>Welcome</b> to the gym zone!</i>',
                [
                    createEntity('messageEntityBold', 0, 7),
                    createEntity('messageEntityItalic', 0, 24),
                ],
                'Welcome to the gym zone!'
            )
            test(
                '<i><b>Welcome to the gym zone!</b></i>',
                [
                    createEntity('messageEntityBold', 0, 24),
                    createEntity('messageEntityItalic', 0, 24),
                ],
                'Welcome to the gym zone!'
            )
        })

        it('should properly handle emojis', () => {
            test(
                "<i>best flower</i>: <b>🌸</b>. <i>don't</i> you even doubt it.",
                [
                    createEntity('messageEntityItalic', 0, 11),
                    createEntity('messageEntityBold', 13, 2),
                    createEntity('messageEntityItalic', 17, 5),
                ],
                "best flower: 🌸. don't you even doubt it."
            )
        })

        it('should handle non-escaped special symbols', () => {
            test(
                '<&> <b>< & ></b> <&>',
                [createEntity('messageEntityBold', 4, 5)],
                '<&> < & > <&>'
            )
        })

        it('should unescape special symbols', () => {
            test(
                '&lt;&amp;&gt; <b>&lt; &amp; &gt;</b> &lt;&amp;&gt; <a href="/?a=&quot;hello&quot;&amp;b">link</a>',
                [
                    createEntity('messageEntityBold', 4, 5),
                    createEntity('messageEntityTextUrl', 14, 4, {
                        url: '/?a="hello"&b',
                    }),
                ],
                '<&> < & > <&> link'
            )
        })

        it('should ignore other tags', () => {
            test('<script>alert(1)</script>', [], 'alert(1)')
        })

        it('should ignore empty urls', () => {
            test('<a href="">link</a> <a>link</a>', [], 'link link')
        })
    })

    describe('template', () => {
        it('should work as a tagged template literal', () => {
            const unsafeString = '<&>'

            expect(html`${unsafeString}`).eq('&lt;&amp;&gt;')
            expect(html`${unsafeString} <b>text</b>`).eq('&lt;&amp;&gt; <b>text</b>')
            expect(html`<b>text</b> ${unsafeString}`).eq('<b>text</b> &lt;&amp;&gt;')
            expect(html`<b>${unsafeString}</b>`).eq('<b>&lt;&amp;&gt;</b>')
        })

        it('should skip with RawString', () => {
            const unsafeString2 = '<&>'
            const unsafeString = new RawString('<&>')

            expect(html`${unsafeString}`).eq('<&>')
            expect(html`${unsafeString} ${unsafeString2}`).eq('<&> &lt;&amp;&gt;')
            expect(html`${unsafeString} <b>text</b>`).eq('<&> <b>text</b>')
            expect(html`<b>text</b> ${unsafeString}`).eq('<b>text</b> <&>')
            expect(html`<b>${unsafeString}</b>`).eq('<b><&></b>')
            expect(html`<b>${unsafeString} ${unsafeString2}</b>`).eq('<b><&> &lt;&amp;&gt;</b>')
        })
    })
})
