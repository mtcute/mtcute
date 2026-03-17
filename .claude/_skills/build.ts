import * as fs from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))

await fs.rm(join(__dirname, 'dist'), { recursive: true, force: true })

for (const dir of await fs.readdir(__dirname, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue
  if (dir.name.startsWith('.')) continue

  const skillDir = join(__dirname, dir.name)
  const outDir = join(__dirname, '../skills', dir.name)

  await fs.mkdir(outDir, { recursive: true })
  await fs.cp(join(skillDir, 'SKILL.md'), join(outDir, 'SKILL.md'))

  if ((await fs.stat(join(skillDir, 'tools')).catch(() => null))?.isDirectory()) {
    const tools = await fs.readdir(join(skillDir, 'tools'))
    if (tools.length) {
      await build({
        entryPoints: tools
          .filter(it => extname(it) === '.ts' && it[0] !== '_')
          .map(it => join(skillDir, 'tools', it)),
        outdir: join(outDir, 'tools'),
        bundle: true,
        platform: 'node',
        target: 'node22',
        format: 'esm',
      })
    }
  }

  if ((await fs.stat(join(skillDir, 'references')).catch(() => null))?.isDirectory()) {
    await fs.cp(join(skillDir, 'references'), join(outDir, 'references'), { recursive: true })
  }
}
