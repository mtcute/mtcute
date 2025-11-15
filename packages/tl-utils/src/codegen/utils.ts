/**
 * Transform snake_case string to camelCase string
 * @param s  Snake_case string
 */
export function snakeToCamel(s: string): string {
  return s.replace(/(?<!^|_)_[a-z0-9]/gi, ($1) => {
    return $1.substring(1).toUpperCase()
  })
}

/**
 * Transform camelCase string to PascalCase string
 * @param s  camelCase string
 */
export const camelToPascal = (s: string): string => s[0].toUpperCase() + s.substring(1)

/**
 * Format a string as a JS documentation comment
 * @param s  Comment to format
 */
export function jsComment(s: string): string {
  return (
    `/**${
      // awesome hack not to break up {@link} links and <a href
      s
        .replace(/<br\/?>/g, '\n\n')
        .replace(/\{@link (.*?)\}/g, '{@link$1}')
        .replace(/<a href/g, '<ahref')
        .replace(/(?![^\n]{1,60}$)([^\n]{1,60})\s/g, '$1\n')
        .replace(/\n|^/g, '\n * ')
        .replace(/\{@link(.*)\}/g, '{@link $1}')
        .replace(/<ahref/g, '<a href')
    }\n */`
  )
}

/**
 * Indent the string with the given amount of spaces
 *
 * @param size  Number of spaces to indent with
 * @param s  String to indent
 */
export function indent(size: number, s: string): string {
  let prefix = ''
  while (size--) prefix += ' '

  return prefix + s.replace(/\n/g, `\n${prefix}`)
}
