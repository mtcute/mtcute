import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  ignores: [
    'e2e/runtime/*',
    'packages/tl/**/*.js',
    'packages/tl/**/*.d.ts',
  ],
  typescript: process.env.CI
    ? {
        tsconfigPath: 'tsconfig.json',
        ignoresTypeAware: [
          '.config/**/*',
          'e2e/**',
          'docs/**',
        ],
        overrides: {
          'ts/consistent-type-imports': 'off',
        },
      }
    : true,
  yaml: false,
  markdown: false,
  jsonc: false,
  pnpm: false, // https://github.com/antfu/eslint-config/issues/791
  linterOptions: {
    reportUnusedDisableDirectives: Boolean(process.env.CI),
  },
  rules: {
    'style/max-len': ['error', {
      code: 120,
      ignoreComments: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
    'unused-imports/no-unused-imports': 'error',
    'curly': ['error', 'multi-line'],
    'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': ['error', 'always'],
    'no-restricted-globals': ['error', 'Buffer', '__dirname', 'require', 'NodeJS', 'setTimeout', 'clearTimeout'],
    'style/quotes': ['error', 'single', { avoidEscape: true }],
    'test/consistent-test-it': 'off',
    'test/prefer-lowercase-title': 'off',
    'test/no-identical-title': 'off',
    'antfu/if-newline': 'off',
    // https://github.com/9romise/eslint-plugin-import-lite/issues/16
    // 'import/no-relative-packages': 'error',
    'style/max-statements-per-line': ['error', { max: 2 }],
    'ts/no-redeclare': 'off',
    'eslint-comments/no-unlimited-disable': 'off',
    'no-cond-assign': 'off',
    'ts/explicit-function-return-type': 'off',
    'no-labels': 'off',
    'no-restricted-syntax': 'off',
    'unicorn/no-new-array': 'off',
    'jsdoc/check-param-names': 'off', // todo: will fix in another iteration
    'jsdoc/require-returns-description': 'off', // todo: will fix in another iteration
    'ts/no-unsafe-member-access': 'off',
    'ts/unbound-method': 'off',
    'ts/strict-boolean-expressions': 'off',
    'ts/promise-function-async': 'off',
    'dot-notation': 'off',
    'ts/dot-notation': 'off',
    'ts/switch-exhaustiveness-check': 'off',
    'ts/restrict-template-expressions': 'off',
    'ts/method-signature-style': 'off',
    'antfu/no-top-level-await': 'off',
    'unicorn/error-message': 'off',
    'eslint-comments/no-duplicate-disable': 'off',
    'eslint-comments/no-unused-enable': 'off',
    'eslint-comments/no-aggregating-enable': 'off',
    // https://github.com/9romise/eslint-plugin-import-lite/issues/15
    // 'import/extensions': ['error', 'always', {
    //     ignorePackages: true,
    //     checkTypeImports: true,
    // }],
  },
}, {
  ignores: [
    // codegen
    'packages/tl/binary/rsa-keys.js',
    'packages/tl/binary/reader.js',
    'packages/tl/binary/writer.js',
    'packages/tl/index.js',
    'packages/tl/index.d.ts',
    'packages/tl/*.json',
    'packages/core/utils.ts',
    'e2e/deno/.jsr-data',
    'e2e/node/.verdaccio',
  ],
}, {
  files: ['e2e/**', 'packages/node/**', 'packages/bun/**'],
  rules: {
    'no-restricted-globals': 'off',
  },
}, {
  files: ['packages/bun/**', 'packages/deno/**'],
  rules: {
    'no-restricted-imports': 'off',
    'import/no-relative-packages': 'off', // common-internals is symlinked from node
  },
}, {
  files: ['**/scripts/**', '**/*.cjs', '.config/**/*'],
  rules: {
    'no-restricted-imports': 'off',
    'no-restricted-globals': 'off',
    'no-console': 'off',
  },
}, {
  files: ['packages/create-*/**', 'packages/deno/**'],
  ignores: ['packages/deno/**/*.test.ts'],
  rules: {
    'node/prefer-global/process': ['error', 'never'],
    'node/prefer-global/buffer': ['error', 'never'],
    'no-console': 'off',
  },
}, {
  files: ['e2e/**', '.config/**'],
  // rules: {
  //     'import/extensions': 'off',
  // },
})
