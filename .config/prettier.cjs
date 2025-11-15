module.exports = {
  arrowParens: 'always',
  bracketSpacing: true,
  embeddedLanguageFormatting: 'auto',
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  jsxBracketSameLine: false,
  jsxSingleQuote: false,
  printWidth: 120,
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  requirePragma: false,
  semi: false,
  singleQuote: true,
  tabWidth: 4,
  trailingComma: 'all',
  useTabs: false,
  vueIndentScriptAndStyle: false,
  overrides: [
    {
      files: [
        // codegen
        'packages/tl/binary/rsa-keys.js',
        'packages/tl/binary/reader.js',
        'packages/tl/binary/writer.js',
        'packages/tl/index.js',
        'packages/tl/*.json',

        '*.d.ts',
        '**/dist',
      ],
      options: { requirePragma: true },
    },
  ],
}
