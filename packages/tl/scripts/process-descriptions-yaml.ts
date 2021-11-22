import {
    CachedDocumentation,
    CachedDocumentationEntry,
} from './documentation'

type MaybeOverwrite =
    | string
    | {
          text: string
          overwrite: boolean
      }

interface RegexRule {
    _cached?: RegExp

    regex: string
    flags?: string
    repl: string
}

interface DescriptionsYaml {
    objects: Record<
        string,
        {
            desc?: MaybeOverwrite
            arguments?: Record<string, MaybeOverwrite>
        }
    >

    arguments: Record<string, string>

    regex: RegexRule[]
}

function unwrapMaybe(what: MaybeOverwrite, has: boolean): string | undefined {
    let text: string
    let overwrite = false
    if (typeof what === 'object') {
        if (!what.text) throw new Error('Invalid overwrite object')
        text = what.text
        overwrite = what.overwrite
    } else {
        text = what
    }

    if (!has || overwrite) {
        return text
    }

    return undefined
}

export function applyDescriptionsYamlFile(
    input: CachedDocumentation,
    yaml: DescriptionsYaml
) {
    const { objects: byObjects, arguments: byArguments, regex: byRegex } = yaml

    // first create an index of all classes and methods
    const objIndex: Record<string, CachedDocumentationEntry> = {}

    function indexObject(
        obj: Record<string, CachedDocumentationEntry>,
        prefix: string
    ) {
        for (const name in obj) {
            if (!obj.hasOwnProperty(name)) continue
            objIndex[prefix + name] = obj[name]
        }
    }

    indexObject(input.classes, 'c_')
    indexObject(input.methods, 'm_')

    // process byObjects
    for (const name in byObjects) {
        if (!byObjects.hasOwnProperty(name)) continue

        const rules = byObjects[name]
        const obj = objIndex[name]

        if (!obj) continue

        if (rules.desc) {
            const desc = unwrapMaybe(rules.desc, !!obj.comment)
            if (desc) obj.comment = desc
        }

        if (rules.arguments) {
            for (const arg in rules.arguments) {
                if (!rules.arguments.hasOwnProperty(arg)) continue

                const repl = unwrapMaybe(
                    rules.arguments[arg],
                    !!obj.arguments && arg in obj.arguments
                )

                if (repl) {
                    if (!obj.arguments) obj.arguments = {}
                    obj.arguments[arg] = repl
                }
            }
        }
    }

    // process byArguments
    for (const i in objIndex) {
        if (!objIndex.hasOwnProperty(i)) continue
        const obj = objIndex[i]

        for (const arg in byArguments) {
            if (!byArguments.hasOwnProperty(arg)) continue
            if (obj.arguments && !(arg in obj.arguments)) continue

            const repl = unwrapMaybe(
                byArguments[arg],
                !!obj.arguments && arg in obj.arguments
            )

            if (repl) {
                if (!obj.arguments) obj.arguments = {}
                obj.arguments[arg] = repl
            }
        }
    }

    // process byRegex
    function applyRegex(str: string | undefined, rule: RegexRule) {
        if (!str) return
        if (!rule._cached) {
            let flags = rule.flags || ''
            if (flags.indexOf('g') === -1) flags += 'g'

            rule._cached = new RegExp(rule.regex, flags)
        }

        return str.replace(rule._cached, rule.repl)
    }

    for (const i in objIndex) {
        if (!objIndex.hasOwnProperty(i)) continue
        const obj = objIndex[i]

        byRegex.forEach((rule) => {
            obj.comment = applyRegex(obj.comment, rule)

            if (obj.arguments) {
                for (let name in obj.arguments) {
                    if (!obj.arguments.hasOwnProperty(name)) continue

                    obj.arguments[name] = applyRegex(obj.arguments[name], rule)!
                }
            }
        })
    }

    for (const i in input.unions) {
        if (!input.unions.hasOwnProperty(i)) continue

        byRegex.forEach((rule) => {
            input.unions[i] = applyRegex(input.unions[i], rule)!
        })
    }

    return input
}
