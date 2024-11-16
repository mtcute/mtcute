/** @type {import('@fuman/build/vite').CustomBuildConfig} */
export default () => ({
    viteConfig: {
        build: {
            lib: {
                formats: ['es'],
            },
        },
    },
})
