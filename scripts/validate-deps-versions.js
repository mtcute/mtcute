import semver from 'semver'
import { fileURLToPath } from 'url'

import { getPackageJsons } from './utils.js'

export async function validateDepsVersions() {
    const packageJsons = await getPackageJsons(true)

    const versions = {}
    const errors = []

    packageJsons.forEach((json) => {
        function check(key) {
            const deps = json[key]
            if (!deps) return

            Object.entries(deps).forEach(([depName, depVersions]) => {
                if (depName.startsWith('@mtcute/')) return

                if (!versions[depName]) {
                    versions[depName] = {}
                }

                Object.entries(versions[depName]).forEach(([pkgName, pkgDepVersions]) => {
                    if (!semver.satisfies(depVersions, pkgDepVersions)) {
                        errors.push(
                            `- at ${json.name} -> ${key} has ${depName}@${depVersions}, but ${pkgName} has @${pkgDepVersions}`,
                        )
                    }
                })

                versions[depName][json.name] = depVersions
            })
        }

        check('dependencies')
        check('devDependencies')
        check('peerDependencies')
        check('optionalDependencies')
    })

    if (errors.length > 0) {
        console.log('⚠️ Found external dependencies mismatch:')
        errors.forEach((err) => console.log(err))
        process.exit(1)
    }

    console.log('✅ All external dependencies match!')
}

if (import.meta.url.startsWith('file:')) {
    const modulePath = fileURLToPath(import.meta.url)

    if (process.argv[1] === modulePath) {
        validateDepsVersions().catch(console.error)
    }
}
