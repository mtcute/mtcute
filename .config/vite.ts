import type { Plugin } from 'vite'
import type { ViteUserConfig } from 'vitest/config'
import { defineConfig } from 'vitest/config'
// https://github.com/oven-sh/bun/issues/4145#issuecomment-2551246135
let runtime = 'node'
if ('bun' in process.versions) runtime = 'bun'
if ('deno' in process.versions) runtime = 'deno'

// resolves `import x from './foo.wasm' with { type: 'file' }` (a bun feature) to the file path,
// so vitest doesn't try to instantiate it as a wasm module
function bunWasmFilePlugin(): Plugin {
  const prefix = '\0wasm-file:'
  return {
    name: 'mtcute:wasm-file',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!source.endsWith('.wasm')) return null
      const resolved = await this.resolve(source, importer, { skipSelf: true })
      if (resolved == null) return null
      return prefix + resolved.id
    },
    load(id) {
      if (!id.startsWith(prefix)) return null
      return `export default ${JSON.stringify(id.slice(prefix.length))}`
    },
  }
}

const poolOptions: ViteUserConfig['test'] = runtime === 'node'
  ? { pool: 'threads' }
  : { pool: 'forks' }

export default defineConfig({
  test: {
    include: [
      'packages/**/*.test.ts',
    ],
    typecheck: {
      include: [
        'packages/**/*.test-d.ts',
      ],
    },
    coverage: {
      include: [
        'packages/**/*.ts',
      ],
      exclude: [
        'packages/**/index.ts',
        'packages/**/*.d.ts',
      ],
    },
    setupFiles: [
      './.config/vite-utils/test-setup.ts',
    ],
    ...poolOptions,
  },
  plugins: runtime === 'bun' ? [bunWasmFilePlugin()] : [],
  esbuild: {
    target: 'esnext',
  },
  define: {
    'process.env.TEST_ENV': JSON.stringify(runtime),
  },
})
