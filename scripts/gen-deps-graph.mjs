// node scripts/gen-deps-graph.mjs | dot -Tsvg > deps.svg
import { getPackageJsons } from './utils.mjs'

const packageJsons = await getPackageJsons()

function getMtcuteName(name) {
    if (!name.startsWith('@mtcute/')) return null

    return name.slice(8)
}

const output = []

for (const pkg of packageJsons) {
    if (!pkg) continue

    const name = getMtcuteName(pkg.name)

    if (!name) continue

    for (const dep of Object.keys(pkg.dependencies || {})) {
        const depName = getMtcuteName(dep)
        if (!depName) continue

        output.push(`"${name}" -> "${depName}"`)
    }

    for (const dep of Object.keys(pkg.devDependencies || {})) {
        const depName = getMtcuteName(dep)
        if (!depName) continue

        output.push(`"${name}" -> "${depName}" [style=dashed,color=grey]`)
    }
}

console.log('digraph {')
console.log(output.join('\n'))
console.log('}')
