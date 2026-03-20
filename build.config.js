import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { exec } from '@fuman/build'
import { asNonNull } from '@fuman/utils'

/** @type {import('@fuman/build').RootConfig} */
export default {
  jsr: {
    exclude: [
      '**/*.{test,bench,test-utils,fixture,test-d}.ts',
      '**/__fixtures__/**',
      '**/__snapshots__/**',
    ],
    sourceDir: 'src',
    enableDenoDirectives: true,
  },
  versioning: {
    exclude: [
      '**/*.test.ts',
      '**/*.test-utils.ts',
      '**/*.test-d.ts',
      '**/*.fixture.ts',
      '**/__fixtures__/**',
      '**/__snapshots__/**',
      '**/*.md',
      'typedoc.cjs',
      '{scripts,dist,tests,private}/**',
    ],
    bumpWithDependants: true,
    beforeReleaseCommit: async (packages) => {
      const OUT_FILE = fileURLToPath(new URL('./scripts/latest-versions.json', import.meta.url))

      const versions = {}

      for (const { json, root } of packages) {
        if (root || json.name === '@mtcute/e2e-tests') continue
        versions[asNonNull(json.name)] = asNonNull(json.version)
      }

      await writeFile(OUT_FILE, JSON.stringify(versions, null, 4))
      await exec(['git', 'add', 'scripts/latest-versions.json'])
    },
  },
  typedoc: {
    out: 'dist/typedoc',
    excludePackages: [
      '@mtcute/create-bot',
    ],
    validation: {
      notExported: true,
      invalidLink: false,
      notDocumented: false,
    },
    plugin: [
      './.config/typedoc/plugin-external-links.js',
      './.config/typedoc/plugin-umami.js',
      './.config/typedoc/plugin-fix-cfpages.js',
    ],
    sourceLinkTemplate: 'https://github.com/mtcute/mtcute/blob/{gitRevision}/{path}#L{line}',
  },
  lint: {
    externalDependencies: {
      // due to jsr libraries
      shouldSkip: ctx => ctx.package.json.name === '@mtcute/deno' || ctx.package.json.name === '@mtcute/e2e-tests',
    },
  },
  viteConfig: '.config/vite.build.ts',
}
