/** @type {import('@fuman/build/vite').CustomBuildConfig} */
export default () => {
  return {
    pluginsPre: [
      {
        name: 'remove-vite-ignore',
        renderChunk(code) {
          return code.replace('/* @vite-ignore */', '').replace('/* @vite-ignore */', '')
        },
      },
    ],
  }
}
