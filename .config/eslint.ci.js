const baseConfig = require('./eslint.cjs')

module.exports = {
    ...baseConfig,
    overrides: [
        baseConfig.overrides[0],
        {
            ...baseConfig.overrides[0],
            files: ['packages/**/*.ts'],
            extends: ['plugin:@typescript-eslint/strict-type-checked', 'plugin:import/typescript'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: true,
                tsconfigRootDir: __dirname,
            },
            rules: {
                ...baseConfig.overrides[0].rules,
                '@typescript-eslint/restrict-template-expressions': ['error', { allowNever: true }],
            },
            reportUnusedDisableDirectives: false,
        },
        ...baseConfig.overrides.slice(1),
        {
            files: ['e2e/**'],
            rules: {
                'import/no-unresolved': 'off',
            },
        },
    ],
}
