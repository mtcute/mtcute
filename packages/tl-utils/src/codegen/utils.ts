export const snakeToCamel = (s: string): string => {
    return s.replace(/(?<!^|_)(_[a-z0-9])/gi, ($1) => {
        return $1.substr(1).toUpperCase()
    })
}

export const camelToPascal = (s: string): string =>
    s[0].toUpperCase() + s.substr(1)

export function jsComment(s: string): string {
    return (
        '/**' +
        s
            .replace(/(?![^\n]{1,60}$)([^\n]{1,60})\s/g, '$1\n')
            .replace(/\n|^/g, '\n * ') +
        '\n */'
    )
}

export function indent(size: number, s: string): string {
    let prefix = ''
    while (size--) prefix += ' '
    return prefix + s.replace(/\n/g, '\n' + prefix)
}
