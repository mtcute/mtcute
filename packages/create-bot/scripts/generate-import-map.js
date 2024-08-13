import * as fs from 'node:fs'

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)))

const importMap = {}

for (const [name, version] of Object.entries(packageJson.dependencies)) {
    importMap[name] = `npm:${name}@${version}`
}

fs.writeFileSync(new URL('import-map.json', import.meta.url), JSON.stringify({ imports: importMap }, null, 2))
