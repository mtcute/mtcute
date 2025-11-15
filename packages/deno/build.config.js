import * as fs from 'node:fs'

/** @type {import('@fuman/build/vite').CustomBuildConfig} */
export default () => ({
  jsr: {
    finalize({ outDir }) {
      // jsr doesn't support symlinks, so we need to copy the files manually
      const real = fs.realpathSync(`${outDir}/common-internals-web`)
      fs.unlinkSync(`${outDir}/common-internals-web`)
      fs.cpSync(real, `${outDir}/common-internals-web`, { recursive: true })
    },
  },
  typedoc: {
    externalPattern: [
      '../core/**',
      '../html-parser/**',
      '../markdown-parser/**',
      '../sqlite/**',
    ],
  },
})
