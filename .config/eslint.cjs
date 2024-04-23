module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['ascii', 'import', 'simple-import-sort'],
    reportUnusedDisableDirectives: true,
    rules: {
        // see https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js#L122
        indent: [
            2,
            4,
            {
                SwitchCase: 1,
                VariableDeclarator: 1,
                outerIIFEBody: 1,
                // MemberExpression: null,
                FunctionDeclaration: {
                    parameters: 1,
                    body: 1,
                },
                FunctionExpression: {
                    parameters: 1,
                    body: 1,
                },
                CallExpression: {
                    arguments: 1,
                },
                ArrayExpression: 1,
                ObjectExpression: 1,
                ImportDeclaration: 1,
                flatTernaryExpressions: false,
                // list derived from https://github.com/benjamn/ast-types/blob/HEAD/def/jsx.js
                ignoredNodes: [
                    'JSXElement',
                    'JSXElement > *',
                    'JSXAttribute',
                    'JSXIdentifier',
                    'JSXNamespacedName',
                    'JSXMemberExpression',
                    'JSXSpreadAttribute',
                    'JSXExpressionContainer',
                    'JSXOpeningElement',
                    'JSXClosingElement',
                    'JSXText',
                    'JSXEmptyExpression',
                    'JSXSpreadChild',
                ],
                ignoreComments: false,
            },
        ],

        semi: [2, 'never', { beforeStatementContinuationChars: 'never' }],
        'semi-spacing': [2, { before: false, after: true }],
        'wrap-iife': [2, 'inside'],
        'no-caller': 2,
        'no-cond-assign': [2, 'except-parens'],
        'no-constant-condition': 0,
        'no-debugger': 2,
        'no-dupe-args': 2,
        'no-dupe-keys': 2,
        'no-duplicate-case': 2,
        'no-empty': [2, { allowEmptyCatch: true }],
        'no-empty-function': 'off',
        'no-extra-boolean-cast': 2,
        // "no-extra-parens": [2, "all"],
        'no-extra-semi': 2,
        'no-func-assign': 2,
        'no-new': 2,
        'no-sparse-arrays': 2,
        'no-unexpected-multiline': 2,
        'no-unreachable': 2,

        'max-params': [1, 5],
        'max-depth': [1, 4],
        'no-eq-null': 0,
        'no-unused-expressions': 0,
        'dot-notation': 2,
        'use-isnan': 2,

        // Best practices
        'block-scoped-var': 2,
        complexity: [0, 11],
        curly: [2, 'multi-line'],
        eqeqeq: [2, 'always', { null: 'ignore' }],
        'no-else-return': 2,
        'no-extra-bind': 2,
        'no-implicit-coercion': 2,
        'no-return-assign': 0,
        'no-sequences': 2,
        yoda: 2,

        // Variables
        'no-restricted-globals': ['error'],
        'no-var': 1,

        // Codestyle
        'arrow-parens': [2, 'always'],
        'array-bracket-spacing': [2, 'never'],
        'brace-style': [2, '1tbs', { allowSingleLine: true }],
        camelcase: [2, { properties: 'never' }],
        'comma-dangle': ['warn', 'always-multiline'],
        'comma-spacing': [2, { before: false, after: true }],
        'eol-last': 2,
        'func-call-spacing': [2, 'never'],
        'block-spacing': 2,
        'keyword-spacing': [2, { before: true, after: true }],
        'max-len': [
            2,
            {
                code: 120,
                ignoreUrls: true,
                ignoreComments: false,
                ignoreRegExpLiterals: true,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
                ignorePattern: 'require',
            },
        ],
        'no-lonely-if': 2,
        'no-mixed-spaces-and-tabs': 2,
        'no-multi-spaces': 2,
        'no-multiple-empty-lines': [2, { max: 1, maxBOF: 0, maxEOF: 0 }],
        'no-trailing-spaces': 2,
        'ascii/valid-name': 2,
        'no-unneeded-ternary': 2,
        'no-nested-ternary': 2,
        'object-curly-spacing': [2, 'always'],
        'one-var-declaration-per-line': [2, 'initializations'],
        'one-var': [2, { let: 'never', const: 'never' }],
        'operator-linebreak': [2, 'after'],
        'padded-blocks': [2, 'never'],
        'quote-props': [2, 'as-needed', { numbers: true }],
        quotes: [2, 'single', { avoidEscape: true }],
        'space-before-blocks': [2, 'always'],
        'space-before-function-paren': [
            2,
            {
                named: 'never',
                anonymous: 'always',
            },
        ],
        'space-in-parens': 2,
        'key-spacing': [2, { beforeColon: false, afterColon: true, mode: 'strict' }],
        'space-infix-ops': 2,
        'padding-line-between-statements': [
            'error',
            { blankLine: 'always', prev: '*', next: 'return' },
            { blankLine: 'always', prev: '*', next: 'block-like' },
            { blankLine: 'any', prev: 'block-like', next: 'block-like' },
            { blankLine: 'any', prev: 'case', next: 'case' },
        ],

        'simple-import-sort/imports': [
            'error',
            {
                groups: [['^[a-z]'], ['^@?mtcute'], ['^@/'], ['^~/'], ['^\\.']],
            },
        ],
        'simple-import-sort/exports': 'error',
        'import/no-relative-packages': 'error',
        'import/no-mutable-exports': 'error',
        'import/no-default-export': 'error',
        'no-console': ['error', { allow: ['warn', 'error'] }],
    },
    ignorePatterns: [
        'node_modules/',
        '.config/',
        '.idea/',
        '.vscode/',

        'private/',
        'docs/',
        'dist/',

        '*.json',

        // codegen
        'packages/tl/binary/rsa-keys.js',
        'packages/tl/binary/reader.js',
        'packages/tl/binary/writer.js',
        'packages/tl/index.js',
        'packages/tl/index.d.ts',
        'packages/tl/*.json',

        'packages/client/utils.ts',
        'packages/core/utils.ts'
    ],
    overrides: [
        {
            files: ['**/*.ts', '**/*.tsx'],
            env: { browser: true, es6: true, node: true },
            extends: ['plugin:@typescript-eslint/strict', 'plugin:import/typescript'],
            globals: { Atomics: 'readonly', SharedArrayBuffer: 'readonly' },
            parser: '@typescript-eslint/parser',
            plugins: ['@typescript-eslint'],
            rules: {
                // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#supported-rules
                '@typescript-eslint/member-delimiter-style': [
                    'error',
                    {
                        multiline: {
                            delimiter: 'none',
                        },
                        singleline: {
                            delimiter: 'semi', // because prettier
                        },
                    },
                ],
                '@typescript-eslint/consistent-type-assertions': 2,
                '@typescript-eslint/no-explicit-any': 2,
                '@typescript-eslint/no-unused-vars': [
                    2,
                    {
                        args: 'after-used',
                        argsIgnorePattern: '^_',
                        ignoreRestSiblings: true,
                        vars: 'all',
                        varsIgnorePattern: '^_',
                    },
                ],
                '@typescript-eslint/no-non-null-assertion': 'off', // todo MTQ-36
                '@typescript-eslint/no-empty-function': 'off',
                '@typescript-eslint/no-confusing-void-expression': 'off',
                '@typescript-eslint/no-unnecessary-condition': 'off',
                '@typescript-eslint/no-var-requires': 'off',

                '@typescript-eslint/no-unsafe-enum-comparison': 'off',
                '@typescript-eslint/no-invalid-void-type': 'off',
                '@typescript-eslint/unbound-method': 'off',
                '@typescript-eslint/no-dynamic-delete': 'off',
                '@typescript-eslint/no-unsafe-member-access': 'off',
                'no-restricted-globals': ['error', 'Buffer', '__dirname', 'require'],
                'no-restricted-imports': [
                    'error',
                    {
                        paths: ['buffer', 'crypto', 'fs', 'path', 'stream'],
                        patterns: ['@mtcute/*/dist**'],
                    },
                ],
            },
            reportUnusedDisableDirectives: false,
            settings: {
                'import/resolver': {
                    node: true,
                    typescript: true,
                },
            },
        },
        {
            files: ['**/scripts/**', '*.test.ts', 'packages/create-*/**', '**/build.config.cjs', 'packages/node/**'],
            rules: {
                'no-console': 'off',
                'no-restricted-imports': [
                    'error',
                    {
                        patterns: ['@mtcute/*/dist**'],
                    },
                ],
            },
        },
        {
            files: ['packages/client/src/methods/**/*.ts'],
            rules: {
                // this + max 3 more
                'max-params': ['error', 4],
            },
        },
        {
            files: ['e2e/**', 'packages/node/**',  'packages/bun/**'],
            rules: {
                'no-restricted-globals': 'off',
            },
        },
        {
            files: ['packages/bun/**'],
            rules: {
                'import/no-unresolved': 'off',
                'no-restricted-imports': 'off',
                'import/no-relative-packages': 'off', // common-internals is symlinked from node
            }
        },
        {
            files: ['e2e/deno/**'],
            rules: {
                'import/no-unresolved': 'off',
            }
        }
    ],
    settings: {
        'import/resolver': {
            node: true,
        },
    },
}
