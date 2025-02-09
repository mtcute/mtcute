/** @type {import('@fuman/build/vite').CustomBuildConfig} */
export default () => ({
    typedoc: {
        externalPattern: [
            '../core/**',
            '../html-parser/**',
            '../markdown-parser/**',
            '../sqlite/**',
        ],
    },
})
