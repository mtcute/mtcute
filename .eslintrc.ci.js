const baseConfig = require('./.eslintrc.js')

module.exports = {
    ...baseConfig,
    overrides: [
        {
            ...baseConfig.overrides[0],
            extends: [
                'plugin:@typescript-eslint/strict-type-checked',
                'plugin:import/typescript',
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: true,
                tsconfigRootDir: __dirname,
            },
            rules: {
                ...baseConfig.overrides[0].rules,
                '@typescript-eslint/restrict-template-expressions': [
                    'error',
                    { allowNever: true },
                ],
            },
            reportUnusedDisableDirectives: false,
        },
        ...baseConfig.overrides.slice(1),
    ],
}
