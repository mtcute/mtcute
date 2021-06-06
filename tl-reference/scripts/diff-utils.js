// in js because also used in scripts

function createTlSchemaIndex(it) {
    let ret = {}
    it.classes.forEach((obj) => {
        obj.uid = 'c_' + obj.name
        obj._type = 'classes'
        ret[obj.uid] = obj
    })
    it.methods.forEach((obj) => {
        obj.uid = 'm_' + obj.name
        obj._type = 'methods'
        ret[obj.uid] = obj
    })
    it.unions.forEach((obj) => {
        obj.uid = 'u_' + obj.type
        obj._type = 'unions'
        ret[obj.uid] = obj
    })
    return ret
}

function createTlConstructorDifference(old, mod) {
    const localDiff = {}

    const argDiff = {
        added: [],
        removed: [],
        modified: [],
    }

    const { oldIndex, modIndex } = (function () {
        function createIndex(obj) {
            const ret = {}
            if (obj.arguments)
                obj.arguments.forEach((arg) => (ret[arg.name] = arg))
            return ret
        }

        return {
            oldIndex: createIndex(old),
            modIndex: createIndex(mod),
        }
    })()

    Object.keys(modIndex).forEach((argName) => {
        if (!(argName in oldIndex)) {
            argDiff.added.push(modIndex[argName])
        } else {
            const old = oldIndex[argName]
            const mod = modIndex[argName]
            if (
                old.type !== mod.type ||
                old.optional !== mod.optional ||
                old.predicate !== mod.predicate
            ) {
                argDiff.modified.push({
                    name: argName,
                    old: old,
                    new: mod,
                })
            }
        }
    })

    Object.keys(oldIndex).forEach((argName) => {
        if (!(argName in modIndex)) {
            argDiff.removed.push(oldIndex[argName])
        }
    })

    if (
        argDiff.removed.length ||
        argDiff.added.length ||
        argDiff.modified.length
    ) {
        localDiff.arguments = argDiff
    }

    if (old.id !== mod.id) localDiff.id = { old: old.id, new: mod.id }
    if (old.type !== mod.type)
        localDiff.type = { old: old.type, new: mod.type }
    if (old.returns !== mod.returns)
        localDiff.returns = { old: old.returns, new: mod.returns }


    if (Object.keys(localDiff).length) return localDiff
    return null
}

function createTlUnionsDifference(old, mod) {
    const diff = {
        added: [],
        removed: [],
    }

    const { oldIndex, modIndex } = (function () {
        function createIndex(obj) {
            const ret = {}
            obj.subtypes.forEach((typ) => (ret[typ] = 1))
            return ret
        }

        return {
            oldIndex: createIndex(old),
            modIndex: createIndex(mod),
        }
    })()

    Object.keys(modIndex).forEach((typ) => {
        if (!(typ in oldIndex)) {
            diff.added.push(typ)
        }
    })

    Object.keys(oldIndex).forEach((typ) => {
        if (!(typ in modIndex)) {
            diff.removed.push(typ)
        }
    })

    if (diff.added.length || diff.removed.length) {
        return { subtypes: diff }
    }

    return null
}

function createTlSchemaDifference(old, mod) {
    const diff = {
        added: { classes: [], methods: [], unions: [] },
        removed: { classes: [], methods: [], unions: [] },
        modified: { classes: [], methods: [], unions: [] },
    }

    old = old.tl
    mod = mod.tl

    // create index for both old and mod
    const oldIndex = createTlSchemaIndex(old)
    const modIndex = createTlSchemaIndex(mod)

    Object.keys(modIndex).forEach((uid) => {
        const type = modIndex[uid]._type

        if (!(uid in oldIndex)) {
            diff.added[type].push(modIndex[uid])
        } else {
            const old = oldIndex[uid]
            const mod = modIndex[uid]

            let localDiff
            if (type === 'unions') {
                localDiff = createTlUnionsDifference(old, mod)
            } else {
                localDiff = createTlConstructorDifference(old, mod)
            }

            if (localDiff) {
                localDiff.name = old.name || old.type
                diff.modified[type].push(localDiff)
            }
        }
    })

    Object.keys(oldIndex).forEach((uid) => {
        if (!(uid in modIndex)) {
            diff.removed[oldIndex[uid]._type].push(oldIndex[uid])
        }
    })

    return diff
}

module.exports = {
    createTlSchemaIndex,
    createTlConstructorDifference,
    createTlUnionsDifference,
    createTlSchemaDifference,
}
