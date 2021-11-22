export const snakeToCamel = (s: string): string => {
    return s.replace(/(?<!^|_)(_[a-z0-9])/gi, ($1) => {
        return $1.substr(1).toUpperCase()
    })
}

export const camelToPascal = (s: string): string =>
    s[0].toUpperCase() + s.substr(1)
