import type { TextWithEntities, tl } from '@mtcute/core'
import { MessageEntity } from '@mtcute/core'
import Long from 'long'
import { describe, expect, it } from 'vitest'

// md is special cased in prettier, we don't want that here
import { md as md_ } from './index.js'

function createEntity<T extends tl.TypeMessageEntity['_']>(type: T, offset: number, length: number, additional?: Omit<tl.FindByName<tl.TypeMessageEntity, T>, '_' | 'offset' | 'length'>): tl.TypeMessageEntity {
  return {
    _: type,
    offset,
    length,
    ...(additional ?? {}),
  } as tl.TypeMessageEntity // idc really, its not that important
}

describe('MarkdownMessageEntityParser', () => {
  describe('unparse', () => {
    const test = (text: string, entities: tl.TypeMessageEntity[], expected: string | string[]): void => {
      const result = md_.unparse({ text, entities })

      if (Array.isArray(expected)) {
        expect(expected).to.include(result)
      } else {
        expect(result).eq(expected)
      }
    }

    it('should return the same text if there are no entities or text', () => {
      test('', [], '')
      test('some text', [], 'some text')
    })

    it('should handle bold, italic, underline, strikethrough and spoiler', () => {
      test(
        'plain bold italic underline strikethrough spoiler plain',
        [
          createEntity('messageEntityBold', 6, 4),
          createEntity('messageEntityItalic', 11, 6),
          createEntity('messageEntityUnderline', 18, 9),
          createEntity('messageEntityStrike', 28, 13),
          createEntity('messageEntitySpoiler', 42, 7),
        ],
        'plain **bold** __italic__ --underline-- ~~strikethrough~~ ||spoiler|| plain',
      )
    })

    it('should handle code and pre', () => {
      test(
        'plain code pre __ignored__ plain',
        [
          createEntity('messageEntityCode', 6, 4),
          createEntity('messageEntityPre', 11, 3),
          createEntity('messageEntityCode', 15, 11),
        ],
        'plain `code` ```\npre\n``` `\\_\\_ignored\\_\\_` plain',
      )
    })

    it('should handle links and text mentions', () => {
      test(
        'plain https://google.com google @durov Pavel Durov mail@mail.ru plain',
        [
          createEntity('messageEntityTextUrl', 25, 6, {
            url: 'https://google.com',
          }),
          createEntity('messageEntityMention', 32, 6),
          createEntity('messageEntityMentionName', 39, 11, {
            userId: 36265675,
          }),
          createEntity('messageEntityEmail', 51, 12),
        ],
        'plain https://google.com [google](https://google.com) @durov [Pavel Durov](tg://user?id=36265675) mail@mail.ru plain',
      )
    })

    it('should handle language in pre', () => {
      test(
        'plain console.log("Hello, world!") some code plain',
        [
          createEntity('messageEntityPre', 6, 28, {
            language: 'javascript',
          }),
          createEntity('messageEntityPre', 35, 9, { language: '' }),
        ],
        'plain ```javascript\nconsole.log("Hello, world!")\n``` ```\nsome code\n``` plain',
      )
    })

    it('should support entities on the edges', () => {
      test(
        'Hello, world',
        [createEntity('messageEntityBold', 0, 5), createEntity('messageEntityBold', 7, 5)],
        '**Hello**, **world**',
      )
    })

    it('should clamp out-of-range entities', () => {
      test(
        'Hello, world',
        [createEntity('messageEntityBold', -2, 7), createEntity('messageEntityBold', 7, 10)],
        '**Hello**, **world**',
      )
    })

    it('should ignore entities outside the length', () => {
      test('Hello, world', [createEntity('messageEntityBold', 50, 5)], 'Hello, world')
    })

    it('should support entities followed by each other', () => {
      test(
        'plain Hello, world plain',
        [createEntity('messageEntityBold', 6, 6), createEntity('messageEntityItalic', 12, 6)],
        [
          'plain **Hello,**__ world__ plain',
          // not the most obvious order, but who cares :D
          // we support this syntax in parse()
          'plain **Hello,__** world__ plain',
        ],
      )
    })

    it('should support nested entities', () => {
      test(
        'Welcome to the gym zone!',
        [createEntity('messageEntityItalic', 0, 24), createEntity('messageEntityBold', 15, 8)],
        '__Welcome to the **gym zone**!__',
      )
    })

    it('should support nested entities with the same edges', () => {
      test(
        'Welcome to the gym zone!',
        [createEntity('messageEntityItalic', 0, 24), createEntity('messageEntityBold', 15, 9)],
        ['__Welcome to the **gym zone!**__', '__Welcome to the **gym zone!__**'],
      )
      test(
        'Welcome to the gym zone!',
        [createEntity('messageEntityBold', 0, 24), createEntity('messageEntityItalic', 15, 9)],
        ['**Welcome to the __gym zone!__**', '**Welcome to the __gym zone!**__'],
      )
      test(
        'Welcome to the gym zone!',
        [createEntity('messageEntityItalic', 0, 24), createEntity('messageEntityBold', 0, 7)],
        ['__**Welcome** to the gym zone!__', '**__Welcome** to the gym zone!__'],
      )
      test(
        'Welcome to the gym zone!',
        [createEntity('messageEntityItalic', 0, 24), createEntity('messageEntityBold', 0, 24)],
        [
          '__**Welcome to the gym zone!**__',
          '__**Welcome to the gym zone!__**',
          '**__Welcome to the gym zone!**__',
          '**__Welcome to the gym zone!__**',
        ],
      )
    })

    it('should support overlapping entities', () => {
      test(
        'Welcome to the gym zone!',
        [createEntity('messageEntityItalic', 0, 14), createEntity('messageEntityBold', 8, 10)],
        '__Welcome **to the__ gym** zone!',
      )
      test(
        'plain bold bold!italic bold!italic!underline underline plain',
        [
          createEntity('messageEntityBold', 6, 38),
          createEntity('messageEntityItalic', 11, 33),
          createEntity('messageEntityUnderline', 23, 31),
        ],
        [
          'plain **bold __bold!italic --bold!italic!underline**__ underline-- plain',
          'plain **bold __bold!italic --bold!italic!underline__** underline-- plain',
        ],
      )
      test(
        'plain bold bold!italic bold!italic!underline italic!underline underline plain',
        [
          createEntity('messageEntityBold', 6, 38),
          createEntity('messageEntityItalic', 11, 50),
          createEntity('messageEntityUnderline', 23, 48),
        ],
        'plain **bold __bold!italic --bold!italic!underline** italic!underline__ underline-- plain',
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
        "__best flower__: **🌸**. __don't__ you even doubt it.",
      )
    })

    it('should escape reserved symbols', () => {
      test(
        '* ** *** _ __ ___ - -- --- ~ ~~ ~~~ [ [[ ` `` ``` ```` \\ \\\\',
        [createEntity('messageEntityItalic', 9, 8)],
        // holy shit
        '/* /*/* /*/*/* __/_ /_/_ /_/_/___ /- /-/- /-/-/- /~ /~/~ /~/~/~ /[ /[/[ /` /`/` /`/`/` /`/`/`/` // ////'
        // so we don't have to escape every single backslash lol
          .replace(/\//g, '\\'),
      )
      test(
        '* ** *** _ __ ___ - -- ---',
        [
          // here we test that the order of the entities does not matter
          createEntity('messageEntityItalic', 18, 4),
          createEntity('messageEntityItalic', 9, 8),
        ],
        '/* /*/* /*/*/* __/_ /_/_ /_/_/___ __/- /-/-__ /-/-/-'.replace(/\//g, '\\'),
      )
    })
  })

  describe('parse', () => {
    const test = (
      texts: string | string[],
      expectedEntities: tl.TypeMessageEntity[],
      expectedText: string,
    ): void => {
      if (!Array.isArray(texts)) texts = [texts]

      for (const text of texts) {
        const res = md_(text)
        expect(res.text).eql(expectedText)
        expect(res.entities ?? []).eql(expectedEntities)
      }
    }

    it('should handle bold, italic, underline, spoiler and strikethrough', () => {
      test(
        'plain **bold** __italic__ --underline-- ~~strikethrough~~ ||spoiler|| plain',
        [
          createEntity('messageEntityBold', 6, 4),
          createEntity('messageEntityItalic', 11, 6),
          createEntity('messageEntityUnderline', 18, 9),
          createEntity('messageEntityStrike', 28, 13),
          createEntity('messageEntitySpoiler', 42, 7),
        ],
        'plain bold italic underline strikethrough spoiler plain',
      )
    })

    it('should trim whitespaces', () => {
      test(
        '  || spoiler || :3',
        [createEntity('messageEntitySpoiler', 0, 8)],
        'spoiler  :3',
      )
      test(
        'meow || spoiler ||',
        [createEntity('messageEntitySpoiler', 5, 8)],
        'meow  spoiler',
      )
      test(
        '|| spoiler ||',
        [createEntity('messageEntitySpoiler', 0, 7)],
        'spoiler',
      )
      test(
        ' || spoiler || ',
        [createEntity('messageEntitySpoiler', 0, 7)],
        'spoiler',
      )
    })

    it('should handle code and pre', () => {
      test(
        [
          'plain `code` ```\npre\n``` `__ignored__` plain',
          'plain `code` ```\npre\n``` `\\_\\_ignored\\_\\_` plain',
          'plain `code` ```\npre``` `\\_\\_ignored\\_\\_` plain',
        ],
        [
          createEntity('messageEntityCode', 6, 4),
          createEntity('messageEntityPre', 11, 3, { language: '' }),
          createEntity('messageEntityCode', 15, 11),
        ],
        'plain code pre __ignored__ plain',
      )

      test(
        'plain ```\npre with ` and ``\n``` plain',
        [createEntity('messageEntityPre', 6, 17, { language: '' })],
        'plain pre with ` and `` plain',
      )

      test(
        'plain ```\npre with \n`\n and \n``\nend\n``` plain',
        [createEntity('messageEntityPre', 6, 24, { language: '' })],
        'plain pre with \n`\n and \n``\nend plain',
      )
    })

    it('should handle links and text mentions', () => {
      test(
        'plain https://google.com [google](https://google.com) @durov [Pavel Durov](tg://user?id=36265675) plain',
        [
          createEntity('messageEntityTextUrl', 25, 6, {
            url: 'https://google.com',
          }),
          createEntity('messageEntityMentionName', 39, 11, {
            userId: 36265675,
          }),
        ],
        'plain https://google.com google @durov Pavel Durov plain',
      )

      test(
        '[user](tg://user?id=1234567&hash=aabbccddaabbccdd)',
        [
          createEntity('inputMessageEntityMentionName', 0, 4, {
            userId: {
              _: 'inputUser',
              userId: 1234567,
              accessHash: Long.fromString('aabbccddaabbccdd', 16),
            },
          }),
        ],
        'user',
      )
    })

    it('should handle language in pre', () => {
      test(
        'plain ```javascript\nconsole.log("Hello, world!")\n``` ```\nsome code\n``` plain',
        [
          createEntity('messageEntityPre', 6, 28, {
            language: 'javascript',
          }),
          createEntity('messageEntityPre', 35, 9, { language: '' }),
        ],
        'plain console.log("Hello, world!") some code plain',
      )
    })

    it('should support entities on the edges', () => {
      test(
        '**Hello**, **world**',
        [createEntity('messageEntityBold', 0, 5), createEntity('messageEntityBold', 7, 5)],
        'Hello, world',
      )
    })

    it('should return empty array if there are no entities', () => {
      test('Hello, world', [], 'Hello, world')
    })

    it('should support overlapping entities', () => {
      test(
        '__Welcome **to the__ gym** zone!',
        [createEntity('messageEntityItalic', 0, 14), createEntity('messageEntityBold', 8, 10)],
        'Welcome to the gym zone!',
      )

      // resulting order will depend on the order in which the closing ** or __ are passed,
      // thus we use separate tests
      test(
        'plain **bold __bold-italic --bold-italic-underline**__ underline-- plain',
        [
          createEntity('messageEntityBold', 6, 38),
          createEntity('messageEntityItalic', 11, 33),
          createEntity('messageEntityUnderline', 23, 31),
        ],
        'plain bold bold-italic bold-italic-underline underline plain',
      )
      test(
        'plain **bold __bold-italic --bold-italic-underline__** underline-- plain',
        [
          createEntity('messageEntityItalic', 11, 33),
          createEntity('messageEntityBold', 6, 38),
          createEntity('messageEntityUnderline', 23, 31),
        ],
        'plain bold bold-italic bold-italic-underline underline plain',
      )

      test(
        'plain **bold __bold-italic --bold-italic-underline** italic-underline__ underline-- plain',
        [
          createEntity('messageEntityBold', 6, 38),
          createEntity('messageEntityItalic', 11, 50),
          createEntity('messageEntityUnderline', 23, 48),
        ],
        'plain bold bold-italic bold-italic-underline italic-underline underline plain',
      )
    })

    it('should support entities followed by each other', () => {
      test(
        ['plain **Hello,**__ world__ plain', 'plain **Hello,__** world__ plain'],
        [createEntity('messageEntityBold', 6, 6), createEntity('messageEntityItalic', 12, 6)],
        'plain Hello, world plain',
      )
    })

    it('should support nested entities', () => {
      test(
        '__Welcome to the **gym zone**!__',
        [createEntity('messageEntityBold', 15, 8), createEntity('messageEntityItalic', 0, 24)],
        'Welcome to the gym zone!',
      )

      test(
        'plain [__google__](https://google.com) plain',
        [
          createEntity('messageEntityItalic', 6, 6),
          createEntity('messageEntityTextUrl', 6, 6, {
            url: 'https://google.com',
          }),
        ],
        'plain google plain',
      )
      test(
        'plain [plain __google__ plain](https://google.com) plain',
        [
          createEntity('messageEntityItalic', 12, 6),
          createEntity('messageEntityTextUrl', 6, 18, {
            url: 'https://google.com',
          }),
        ],
        'plain plain google plain plain',
      )
    })

    it('should support nested entities with the same edges', () => {
      // again, order of the entities depends on which closing tag goes first.
      test(
        '__Welcome to the **gym zone!**__',
        [createEntity('messageEntityBold', 15, 9), createEntity('messageEntityItalic', 0, 24)],
        'Welcome to the gym zone!',
      )
      test(
        '__Welcome to the **gym zone!__**',
        [createEntity('messageEntityItalic', 0, 24), createEntity('messageEntityBold', 15, 9)],
        'Welcome to the gym zone!',
      )

      test(
        '**Welcome to the __gym zone!__**',
        [createEntity('messageEntityItalic', 15, 9), createEntity('messageEntityBold', 0, 24)],
        'Welcome to the gym zone!',
      )
      test(
        '**Welcome to the __gym zone!**__',
        [createEntity('messageEntityBold', 0, 24), createEntity('messageEntityItalic', 15, 9)],
        'Welcome to the gym zone!',
      )

      test(
        ['__**Welcome** to the gym zone!__', '**__Welcome** to the gym zone!__'],
        [createEntity('messageEntityBold', 0, 7), createEntity('messageEntityItalic', 0, 24)],
        'Welcome to the gym zone!',
      )

      test(
        ['__**Welcome to the gym zone!**__', '**__Welcome to the gym zone!**__'],
        [createEntity('messageEntityBold', 0, 24), createEntity('messageEntityItalic', 0, 24)],
        'Welcome to the gym zone!',
      )
      test(
        ['__**Welcome to the gym zone!__**', '**__Welcome to the gym zone!__**'],
        [createEntity('messageEntityItalic', 0, 24), createEntity('messageEntityBold', 0, 24)],
        'Welcome to the gym zone!',
      )
    })

    it('should properly handle emojis', () => {
      test(
        "__best flower__: **🌸**. __don't__ you even doubt it.",
        [
          createEntity('messageEntityItalic', 0, 11),
          createEntity('messageEntityBold', 13, 2),
          createEntity('messageEntityItalic', 17, 5),
        ],
        "best flower: 🌸. don't you even doubt it.",
      )
    })

    it('should handle escaped reserved symbols', () => {
      test(
        '/* /*/* /*/*/* __/_ /_/_ /_/_/___ /- /-/- /-/-/- /~ /~/~ /~/~/~ /[ /[/[ /` /`/` /`/`/` /`/`/`/` // ////'.replace(
          /\//g,
          '\\',
        ),
        [createEntity('messageEntityItalic', 9, 8)],
        '* ** *** _ __ ___ - -- --- ~ ~~ ~~~ [ [[ ` `` ``` ```` \\ \\\\',
      )
      test(
        '/* /*/* /*/*/* __/_ /_/_ /_/_/___ __/- /-/-__ /-/-/-'.replace(/\//g, '\\'),
        [createEntity('messageEntityItalic', 9, 8), createEntity('messageEntityItalic', 18, 4)],
        '* ** *** _ __ ___ - -- ---',
      )
    })

    it('should ignore empty urls', () => {
      test('[link]() [link]', [], 'link [link]')
    })

    describe('malformed input', () => {
      it('should treat malformed links as plain text', () => {
        test(
          'plain [link](https://google.com but unclosed',
          [],
          'plain [link](https://google.com but unclosed',
        )

        test(
          'plain [**bold link**](https://google.com but __unclosed__',
          [createEntity('messageEntityBold', 7, 9), createEntity('messageEntityItalic', 41, 8)],
          'plain [bold link](https://google.com but unclosed',
        )
      })

      it('should ignore malformed pres', () => {
        test('plain ```pre without linebreaks```', [], 'plain ```pre without linebreaks```')
        test('plain ``` pre without linebreaks but with spaces instead ```', [], 'plain ``` pre without linebreaks but with spaces instead ```')
      })

      it('should ignore unterminated entities', () => {
        test('plain **bold but unclosed', [], 'plain **bold but unclosed')
        test('meow**', [], 'meow**')
        test('meow**__', [], 'meow**__')
        test('meow`woof', [], 'meow`woof')
        test('meow```woof', [], 'meow```woof')
        test(
          'meow```woof **bold**',
          [createEntity('messageEntityBold', 12, 4)],
          'meow```woof bold',
        )
        test('plain **bold and __also italic but unclosed', [], 'plain **bold and __also italic but unclosed')
        test(
          'plain **bold and __italic__',
          [createEntity('messageEntityItalic', 17, 6)],
          'plain **bold and italic',
        )
      })
    })
  })

  describe('template', () => {
    const test = (text: TextWithEntities, expectedEntities: tl.TypeMessageEntity[], expectedText: string): void => {
      expect(text.text).eql(expectedText)
      expect(text.entities ?? []).eql(expectedEntities)
    }

    it('should add plain strings as is', () => {
      test(md_`${'**plain**'}`, [], '**plain**')
    })

    it('should handle strings at line breaks', () => {
      test(md_`
some text ${'meow'}
some more ${'text'}
meow
`, [], 'some text meow\nsome more text\nmeow')
      test(md_`
some ${'text'}

${'meowww'}
`, [], 'some text\n\nmeowww')
    })

    it('should handle numbers/Longs', () => {
      test(md_`${1234567890}`, [], '1234567890')
      test(md_`${Long.fromString('1234567890')}`, [], '1234567890')
    })

    it('should skip falsy values', () => {
      test(md_`some text ${null} more text ${false}`, [], 'some text  more text')
    })

    it('should properly dedent', () => {
      test(
        md_`
                some text
                **bold**
                more text
            `,
        [createEntity('messageEntityBold', 10, 4)],
        'some text\nbold\nmore text',
      )

      test(
        md_`text\n\n\nmore text`,
        [],
        'text\n\n\nmore text',
      )
    })

    it('should process entities', () => {
      const inner = md_`**bold**`

      test(
        md_`some text ${inner} some more text`,
        [createEntity('messageEntityBold', 10, 4)],
        'some text bold some more text',
      )
      test(
        md_`some text ${inner} some more ${inner} text`,
        [createEntity('messageEntityBold', 10, 4), createEntity('messageEntityBold', 25, 4)],
        'some text bold some more bold text',
      )
    })

    it('should process entities on edges', () => {
      test(
        md_`${md_`**bold**`} and ${md_`__italic__`}`,
        [createEntity('messageEntityBold', 0, 4), createEntity('messageEntityItalic', 9, 6)],
        'bold and italic',
      )
    })

    it('should process nested entities', () => {
      test(
        md_`**bold ${md_`__bold italic__`} more bold**`,
        [createEntity('messageEntityItalic', 5, 11), createEntity('messageEntityBold', 0, 26)],
        'bold bold italic more bold',
      )
      test(
        md_`**bold ${md_`__bold italic__ --and some underline--`} more bold**`,
        [
          createEntity('messageEntityItalic', 5, 11),
          createEntity('messageEntityUnderline', 17, 18),
          createEntity('messageEntityBold', 0, 45),
        ],
        'bold bold italic and some underline more bold',
      )
      test(
        md_`**${md_`__bold italic --underline--__`}**`,
        [
          createEntity('messageEntityUnderline', 12, 9),
          createEntity('messageEntityItalic', 0, 21),
          createEntity('messageEntityBold', 0, 21),
        ],
        'bold italic underline',
      )
    })

    it('should handle quotes', () => {
      test(
        md_`
some text :3
> btw i like ${'quotes'}
> and also **formatting**
>   :3
some more text
`,
        [createEntity('messageEntityBold', 40, 10), createEntity('messageEntityBlockquote', 13, 40)],
        'some text :3\nbtw i like quotes\nand also formatting\n:3\nsome more text',
      )
    })

    it('should interpolate inside links', () => {
      test(
        md_`[${'link'}](${'https'}://example.com/\\)${'foo'}/bar/${'baz'}?foo=bar&baz=${'egg'})`,
        [
          createEntity('messageEntityTextUrl', 0, 4, {
            url: 'https://example.com/)foo/bar/baz?foo=bar&baz=egg',
          }),
        ],
        'link',
      )
      test(
        md_`[emoji](tg://emoji?id=${Long.fromNumber(123123)})`,
        [createEntity('messageEntityCustomEmoji', 0, 5, { documentId: Long.fromNumber(123123) })],
        'emoji',
      )
    })

    it('should process MessageEntity', () => {
      test(
        md_`**bold ${new MessageEntity(createEntity('messageEntityItalic', 0, 11), 'bold italic')} more bold**`,
        [createEntity('messageEntityItalic', 5, 11), createEntity('messageEntityBold', 0, 26)],
        'bold bold italic more bold',
      )
    })
  })
})
