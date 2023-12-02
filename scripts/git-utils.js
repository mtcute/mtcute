const cp = require('child_process')

function getLatestTag() {
    try {
        const res = cp.execSync('git describe --abbrev=0 --tags', { encoding: 'utf8', stdio: 'pipe' }).trim()

        return res
    } catch (e) {
        if (e.stderr.match(/^fatal: (No names found|No tags can describe)/i)) {
            // no tags found, let's just return the first commit
            return cp.execSync('git rev-list --max-parents=0 HEAD', { encoding: 'utf8' }).trim()
        }

        throw e
    }
}

function findChangedFilesSince(tag, until = 'HEAD') {
    return cp.execSync(`git diff --name-only ${tag} ${until}`, { encoding: 'utf8', stdio: 'pipe' }).trim().split('\n')
}

function getCommitsSince(tag, until = 'HEAD') {
    const delim = `---${Math.random().toString(36).slice(2)}---`

    const lines = cp
        .execSync(`git log --pretty="format:%H %s%n%b%n${delim}" ${tag}..${until}`, { encoding: 'utf8', stdio: 'pipe' })
        .trim()
        .split('\n')

    const items = []

    let current = null

    for (const line of lines) {
        if (line === delim) {
            if (current) items.push(current)
            current = null
        } else if (current) {
            if (current.description) current.description += '\n'
            current.description += line
        } else {
            const [hash, ...msg] = line.split(' ')
            current = { hash, msg: msg.join(' '), description: '' }
        }
    }

    if (current) items.push(current)

    return items.reverse()
}

function parseConventionalCommit(msg) {
    const match = msg.match(/^(\w+)(?:\(([^)]+)\))?(!?): (.+)$/)

    if (!match) return null

    const [, type, scope, breaking, subject] = match

    return { type, scope, breaking: Boolean(breaking), subject }
}

module.exports = {
    getLatestTag,
    findChangedFilesSince,
    getCommitsSince,
    parseConventionalCommit,
}
