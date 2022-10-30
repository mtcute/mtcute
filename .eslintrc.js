module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
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
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-debugger': 'off',
        'no-empty': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        'prefer-rest-params': 'off',
        'no-prototype-builtins': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/adjacent-overload-signatures': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-extra-semi': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
    },
}
