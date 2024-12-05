import antfu from '@antfu/eslint-config'

export default antfu({
    type: 'lib',
    ignores: ['e2e/runtime/*'],
    typescript: process.env.CI
        ? {
            tsconfigPath: 'tsconfig.json',
            ignoresTypeAware: [
                '.config/**/*',
                'e2e/**',
            ],
            overrides: {
                'ts/consistent-type-imports': 'off',
            },
        }
        : true,
    yaml: false,
    markdown: false,
    jsonc: false,
    linterOptions: {
        reportUnusedDisableDirectives: Boolean(process.env.CI),
    },
    rules: {
        'style/indent': ['error', 4, {
            offsetTernaryExpressions: false,
            // the rest is from default config: https://github.com/eslint-stylistic/eslint-stylistic/blob/main/packages/eslint-plugin/configs/customize.ts
            ArrayExpression: 1,
            CallExpression: { arguments: 1 },
            flatTernaryExpressions: false,
            FunctionDeclaration: { body: 1, parameters: 1 },
            FunctionExpression: { body: 1, parameters: 1 },
            ignoreComments: false,
            ignoredNodes: [
                'TemplateLiteral *',
                'TSUnionType',
                'TSIntersectionType',
                'TSTypeParameterInstantiation',
                'FunctionExpression > .params[decorators.length > 0]',
                'FunctionExpression > .params > :matches(Decorator, :not(:first-child))',
            ],
            ImportDeclaration: 1,
            MemberExpression: 1,
            ObjectExpression: 1,
            outerIIFEBody: 1,
            SwitchCase: 1,
            VariableDeclarator: 1,
        }],
        'style/max-len': ['error', {
            code: 120,
            ignoreComments: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
        }],
        'unused-imports/no-unused-imports': 'error',
        'curly': ['error', 'multi-line'],
        'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
        'node/prefer-global/process': ['error', 'always'],
        'node/prefer-global/buffer': ['error', 'always'],
        'no-restricted-globals': ['error', 'Buffer', '__dirname', 'require', 'NodeJS', 'setTimeout', 'clearTimeout'],
        'style/quotes': ['error', 'single', { avoidEscape: true }],
        'test/consistent-test-it': 'off',
        'test/prefer-lowercase-title': 'off',
        'test/no-identical-title': 'off',
        'antfu/if-newline': 'off',
        'import/no-relative-packages': 'error',
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
        'import/extensions': ['error', 'always', {
            ignorePackages: true,
            checkTypeImports: true,
        }],
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
    rules: {
        'node/prefer-global/process': ['error', 'never'],
        'node/prefer-global/buffer': ['error', 'never'],
        'no-console': 'off',
    },
}, {
    files: ['e2e/**', '.config/**'],
    rules: {
        'import/extensions': 'off',
    },
})
