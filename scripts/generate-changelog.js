const fs = require('fs')
const { getLatestTag, getCommitsSince, parseConventionalCommit, findChangedFilesSince } = require('./git-utils')

function generateChangelog(onlyPackages) {
    const byPackage = {}

    for (const commit of getCommitsSince(getLatestTag())) {
        const parsed = parseConventionalCommit(commit.msg)

        if (!parsed) {
            console.warn('[warn] Failed to parse commit message: %s', commit.msg)
            continue
        }

        const { type, breaking } = parsed

        if ((!type || ['chore', 'ci', 'docs', 'test'].includes(type)) && !breaking) continue

        const changed = findChangedFilesSince(`${commit.hash}~1`, commit.hash)

        let line = `- ${commit.hash}: ${breaking ? '**❗ BREAKING** ' : ''}${commit.msg}`

        if (breaking && commit.description) {
            line +=
                '\n' +
                commit.description
                    .trim()
                    .split('\n')
                    .map((line) => `  ${line}`)
                    .join('\n')
        }

        for (const file of changed) {
            if (!file.startsWith('packages/')) continue
            const pkg = file.split('/')[1]
            if (onlyPackages && !onlyPackages.includes(pkg)) continue

            if (!byPackage[pkg]) byPackage[pkg] = {}
            byPackage[pkg][commit.hash] = line
            // console.log('including %s in %s because of %s', commit.hash, pkg, file)
        }
    }

    let ret = ''

    for (const [pkg, lines] of Object.entries(byPackage)) {
        ret += `### ${pkg}\n`
        ret += Object.values(lines).join('\n')
        ret += '\n\n'
    }

    return ret
}

if (require.main === module) {
    let onlyPackages = null

    if (process.argv[2]) {
        onlyPackages = process.argv[2].split(',')
    }

    const res = generateChangelog(onlyPackages)

    if (process.env.CI && process.env.GITHUB_OUTPUT) {
        const delim = `---${require('crypto').randomUUID()}---${require('os').EOL}`
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `changelog<<${delim}${res}${delim}`)
    } else {
        console.log(res)
    }
}
