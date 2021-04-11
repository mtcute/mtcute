// since this logic is quite big, i decided to
// implement it in a separate file
//
// this basically takes descriptions.yaml and applies
// it to the resulting JSON.

async function applyDescriptionsFile(input, yaml) {
    const {
        objects: byObjects,
        arguments: byArguments,
        regex: byRegex,
    } = yaml

    // util function to handle text and objects with text for overrides
    function applyOverwrite(where, what) {
        let text = what
        let overwrite = false
        if (typeof what === 'object') {
            if (!what.text) throw new Error('Invalid overwrite object')
            text = what.text
            overwrite = what.overwrite
        }

        if (!where.description || overwrite) {
            where.description = text
        }
    }

    // first create an index of all classes, methods and unions
    const index = {}

    function indexNs(ns, prefix = '') {
        Object.entries(ns).forEach(([name, content]) => {
            const pref = prefix + (name === '$root' ? '' : `${name}.`)

            content.classes.forEach(
                (obj) => (index['o_' + pref + obj.name] = obj)
            )
            content.methods.forEach(
                (obj) => (index['o_' + pref + obj.name] = obj)
            )
            content.unions.forEach(
                (obj) => (index['u_' + pref + obj.type] = obj)
            )
        })
    }

    indexNs(input.mtproto, 'mt_')
    indexNs(input.api)

    // process byObject
    Object.entries(byObjects).forEach(([name, content]) => {
        if (!(name in index)) {
            return
        }

        const obj = index[name]

        if (content.desc) applyOverwrite(obj, content.desc)
        if (content.arguments)
            Object.entries(content.arguments).forEach(([arg, repl]) => {
                const argObj = (obj.arguments || []).find(
                    (it) => it.name === arg
                )
                if (!argObj) return

                applyOverwrite(argObj, repl)
            })
    })

    // process byArguments
    // first create index based on `name`
    const byArgumentsIndex = {}
    byArguments.forEach((rule) => {
        let name = rule.name
        if (!Array.isArray(name)) name = [name]

        name.forEach((n) => {
            if (!(n in byArgumentsIndex)) byArgumentsIndex[n] = []
            byArgumentsIndex[n].push(rule)
        })
    })

    // now find all objects with these arguments and patch
    Object.entries(index).forEach(([key, obj]) => {
        if (!obj.arguments) return // unions

        args: for (const arg of obj.arguments) {
            if (!(arg.name in byArgumentsIndex)) continue

            const rules = byArgumentsIndex[arg.name]
            for (const rule of rules) {
                if (rule.filters) {
                    for (const filter of rule.filters) {
                        if (filter.objType && filter.objType[0] !== key[0])
                            break args
                        if (filter.type && !filter.type.split(' | ').includes(arg.type))
                            break args

                        // noinspection EqualityComparisonWithCoercionJS
                        if (filter.optional && arg.optional != filter.optional)
                            break args
                    }
                }

                applyOverwrite(arg, rule.desc)
            }
        }
    })

    // process byRegex
    function replaceRegex(obj, regex) {
        if (!obj.description) return
        if (!regex._cached) regex._cached = new RegExp(regex.regex, regex.flags)
        obj.description = obj.description.replace(
            regex._cached,
            regex.repl
        )
    }

    Object.values(index).forEach((obj) => {
        for (const regex of byRegex) {
            replaceRegex(obj, regex)

            if (obj.arguments) obj.arguments.forEach((arg) => replaceRegex(arg, regex))
        }
    })

    debugger
}

module.exports = {
    applyDescriptionsFile,
}

if (require.main === module) {
    applyDescriptionsFile(require('../raw-schema.json'))
        .then(console.log)
        .catch((err) => {
            console.error(err)
            process.exit(1)
        })
}
