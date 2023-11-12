/* eslint-disable no-restricted-globals */
const ts = require('typescript')
const path = require('path')
const fs = require('fs')
const prettier = require('prettier')
const updates = require('./generate-updates.cjs')

const schema = require('../../tl/api-schema.json')

function findMethodAvailability(method) {
    const entry = schema.e.find((it) => it.kind === 'method' && it.name === method)
    if (!entry) return null

    return entry.available ?? null
}

const targetDir = path.join(__dirname, '../src')

async function* getFiles(dir) {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true })

    for (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name)

        if (dirent.isDirectory()) {
            yield* getFiles(res)
        } else {
            yield res
        }
    }
}

function throwError(ast, file, text) {
    console.log(
        `An error encountered at ${path.relative(targetDir, file)}:
 > ${ast.getText()}
${text}`,
    )
    process.exit(0)
}

function visitRecursively(ast, check, callback) {
    const visit = (node) => {
        if (!ts.isNode(node)) return

        // recursively continue visiting
        for (const [key, value] of Object.entries(node)) {
            if (!value || typeof value !== 'object' || key === 'parent') {
                continue
            }

            if (Array.isArray(value)) {
                value.forEach(visit)
            } else {
                visit(value)
            }
        }

        if (check(node)) {
            callback(node)
        }
    }

    visit(ast)
}

function findRawApiUsages(ast, fileName) {
    // find `cilent.call({ _: '...', ...})

    if (ast.kind !== ts.SyntaxKind.FunctionDeclaration) return []
    const firstParamName = ast.parameters[0]?.name?.escapedText
    if (!firstParamName) return []

    const usages = []

    visitRecursively(
        ast,
        (node) => node.kind === ts.SyntaxKind.CallExpression,
        (call) => {
            if (call.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) return
            const prop = call.expression

            if (
                prop.name.escapedText === 'call' &&
                prop.expression.kind === ts.SyntaxKind.Identifier &&
                prop.expression.escapedText === firstParamName
            ) {
                usages.push(call)
            }
        },
    )

    const methodUsages = []

    for (const call of usages) {
        const arg = call.arguments[0]

        if (!arg || arg.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
            throwError(
                call,
                fileName,
                'First argument to this.call() must be an object literal. Please use @available directive manually',
            )
        }

        const method = arg.properties.find((it) => it.name.escapedText === '_')

        if (!method || method.kind !== ts.SyntaxKind.PropertyAssignment) {
            throwError(call, fileName, 'First argument to this.call() must have a _ property')
        }

        const init = method.initializer

        if (init.kind === ts.SyntaxKind.StringLiteral) {
            methodUsages.push(init.text)
        } else if (init.kind === ts.SyntaxKind.ConditionalExpression) {
            const whenTrue = init.whenTrue
            const whenFalse = init.whenFalse

            if (whenTrue.kind !== ts.SyntaxKind.StringLiteral || whenFalse.kind !== ts.SyntaxKind.StringLiteral) {
                throwError(
                    call,
                    fileName,
                    'Too complex, failed to extract method name, please use @available directive manually',
                )
            }

            methodUsages.push(whenTrue.text, whenFalse.text)
        } else {
            throwError(
                call,
                fileName,
                'Too complex, failed to extract method name, please use @available directive manually',
            )
        }
    }

    return methodUsages
}

function findDependencies(ast) {
    const deps = new Set()

    visitRecursively(
        ast,
        (node) => node.kind === ts.SyntaxKind.CallExpression,
        (call) => {
            if (call.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) return
            const prop = call.expression

            if (
                prop.name.escapedText !== 'call' &&
                prop.name.escapedText !== '_emitError' &&
                prop.name.escapedText !== '_cachePeersFrom' &&
                prop.name.escapedText !== 'importSession' &&
                prop.name.escapedText !== 'emit' &&
                prop.expression.kind === ts.SyntaxKind.ThisKeyword
            ) {
                deps.add(prop.name.escapedText)
            }
        },
    )

    return [...deps]
}

function determineCommonAvailability(methods, resolver = (v) => v) {
    let common = 'both'

    for (const method of methods) {
        const available = resolver(method)

        if (available === null) {
            console.log('availability null for ' + method)

            return null
        }

        if (common === 'both') {
            common = available
        } else if (available !== 'both' && common !== available) {
            return null
        }
    }

    return common
}

async function addSingleMethod(state, fileName) {
    const fileFullText = await fs.promises.readFile(fileName, 'utf-8')
    const program = ts.createSourceFile(path.basename(fileName), fileFullText, ts.ScriptTarget.ES2018, true)
    const relPath = path.relative(targetDir, fileName).replace(/\\/g, '/') // replace path delim to unix
    const module = `./${relPath.replace(/\.ts$/, '.js')}`

    state.files[relPath] = fileFullText

    function getLeadingComments(ast) {
        return (ts.getLeadingCommentRanges(fileFullText, ast.pos) || [])
            .map((range) => fileFullText.substring(range.pos, range.end))
            .join('\n')
    }

    function checkForFlag(ast, flag) {
        return getLeadingComments(ast)
            .split('\n')
            .map((i) => i.replace(/^(\/\/|\s*\*+|\/\*\*+\s*)/g, '').trim())
            .find((i) => i.startsWith(flag))
    }

    const hasOverloads = {}

    for (const stmt of program.statements) {
        const isCopy = checkForFlag(stmt, '@copy')
        const isTypeExported = checkForFlag(stmt, '@exported')

        if (stmt.kind === ts.SyntaxKind.ImportDeclaration) {
            if (!isCopy) continue

            if (
                !stmt.importClause.namedBindings ||
                stmt.importClause.namedBindings.kind !== ts.SyntaxKind.NamedImports
            ) {
                throwError(stmt, fileName, 'Only named imports are supported!')
            }

            let module = stmt.moduleSpecifier.text

            if (module[0] === '.') {
                // relative, need to resolve
                const modFullPath = path.join(path.dirname(fileName), stmt.moduleSpecifier.text)
                const modPath = path.dirname(modFullPath)
                const modName = path.basename(modFullPath)

                module = path.join(path.relative(targetDir, modPath), modName).replace(/\\/g, '/') // replace path delim to unix
                if (module[0] !== '.') module = './' + module
            }

            if (module === './client') {
                throwError(stmt, fileName, "You can't copy an import from ./client")
            }

            if (!(module in state.imports)) {
                state.imports[module] = new Set()
            }

            for (const el of stmt.importClause.namedBindings.elements) {
                state.imports[module].add(el.name.escapedText)
            }
        } else if (stmt.kind === ts.SyntaxKind.FunctionDeclaration) {
            const name = stmt.name.escapedText

            if (stmt.body && name in state.methods.used) {
                throwError(
                    stmt.name,
                    fileName,
                    `Function name "${name}" was already used in file ${state.methods.used[name]}`,
                )
            }

            const isExported = (stmt.modifiers || []).find((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
            const isInitialize = checkForFlag(stmt, '@initialize')
            const aliases = (function () {
                const flag = checkForFlag(stmt, '@alias')
                if (!flag) return []

                const [, aliases] = flag.split('=')
                if (!aliases || !aliases.length) return []

                return aliases.split(',')
            })()
            const available = (function () {
                const flag = checkForFlag(stmt, '@available')
                if (!flag) return null

                const [, available] = flag.split('=')
                if (!available || !available.length) return null

                if (available !== 'user' && available !== 'bot' && available !== 'both') {
                    throwError(stmt, fileName, `Invalid value for @available flag: ${available}`)
                }

                return available
            })()
            const rawApiMethods = available === null && findRawApiUsages(stmt, fileName)
            const dependencies = findDependencies(stmt).filter((it) => it !== name)

            if (isInitialize && isExported) {
                throwError(isExported, fileName, 'Initialization methods must not be exported')
            }

            if (isInitialize) {
                let code = stmt.body.getFullText()

                // strip leading { and trailing }
                while (code[0] !== '{') code = code.slice(1)
                while (code[code.length - 1] !== '}') code = code.slice(0, -1)
                code = code.slice(1, -1).trim()

                state.init.push(code)
            }

            if (!isExported) continue

            const firstArg = stmt.parameters[0]

            if (isExported && (!firstArg || firstArg.type.getText() !== 'BaseTelegramClient')) {
                continue
            }

            // overloads
            const isOverload = !stmt.body

            if (isOverload) {
                hasOverloads[name] = true
            } else {
                state.methods.used[name] = relPath
            }

            if (isExported) {
                const isPrivate = checkForFlag(stmt, '@internal')
                const isManual = checkForFlag(stmt, '@manual')
                const isNoemit = checkForFlag(stmt, '@noemit')
                const shouldEmit = !isNoemit && !(isPrivate && !isOverload && !Object.keys(hasOverloads).length)

                if (shouldEmit) {
                    state.methods.list.push({
                        from: relPath,
                        name,
                        isPrivate,
                        isManual,
                        isNoemit,
                        shouldEmit,
                        func: stmt,
                        comment: getLeadingComments(stmt),
                        aliases,
                        available,
                        rawApiMethods,
                        dependencies,
                        overload: isOverload,
                        hasOverloads: hasOverloads[name] && !isOverload,
                    })

                    if (!(module in state.imports)) {
                        state.imports[module] = new Set()
                    }

                    if (!isManual) state.imports[module].add(name)
                }
            }
        } else if (stmt.kind === ts.SyntaxKind.InterfaceDeclaration) {
            if (isCopy) {
                state.copy.push({
                    from: relPath,
                    code: stmt.getText(),
                })
                continue
            }

            const isExported = (stmt.modifiers || []).find((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)

            if (isTypeExported) {
                if (!isExported) {
                    throwError(stmt, fileName, 'Exported interfaces must be exported')
                }

                if (!(module in state.imports)) {
                    state.imports[module] = new Set()
                }

                state.imports[module].add(stmt.name.escapedText)
                continue
            }

            if (!checkForFlag(stmt, '@extension')) continue

            if (isExported) {
                throwError(isExported, fileName, 'Extension interfaces must not be imported')
            }
            if (stmt.heritageClauses && stmt.heritageClauses.length) {
                throwError(stmt.heritageClauses[0], fileName, 'Extension interfaces must not be extended')
            }

            for (const member of stmt.members || []) {
                state.fields.push({
                    from: relPath,
                    code: member.getText(),
                })
            }
        } else if (stmt.kind === ts.SyntaxKind.TypeAliasDeclaration && isTypeExported) {
            const isExported = (stmt.modifiers || []).find((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)

            if (!isExported) {
                throwError(stmt, fileName, 'Exported type aliases must be exported')
            }

            if (!(module in state.imports)) {
                state.imports[module] = new Set()
            }

            state.imports[module].add(stmt.name.escapedText)
        } else if (isCopy) {
            state.copy.push({ from: relPath, code: stmt.getFullText().trim() })
        } else if (isTypeExported) {
            throwError(stmt, fileName, 'Only functions and interfaces can be exported')
        }
    }
}

async function main() {
    const output = fs.createWriteStream(path.join(__dirname, '../src/client.ts'))
    const state = {
        imports: {},
        fields: [],
        init: [],
        methods: {
            used: {},
            list: [],
        },
        copy: [],
        files: {},
    }

    for await (const file of getFiles(path.join(__dirname, '../src/methods'))) {
        if (!file.startsWith('.') && file.endsWith('.ts') && !file.endsWith('.web.ts') && !file.endsWith('.test.ts')) {
            await addSingleMethod(state, file)
        }
    }

    output.write(
        '/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/unified-signatures */\n' +
            '/* THIS FILE WAS AUTO-GENERATED */\n'
    )
    Object.entries(state.imports).forEach(([module, items]) => {
        items = [...items]
        if (!items.length) return
        output.write(`import { ${items.sort().join(', ')} } from '${module}'\n`)
    })

    output.write('\n')

    state.copy.forEach(({ from, code }) => {
        output.write(`// from ${from}\n${code}\n`)
    })

    output.write('\nexport interface TelegramClient extends BaseTelegramClient {\n')

    output.write(`/**
 * Register a raw update handler
 *
 * @param name  Event name
 * @param handler  Raw update handler
 */
 on(name: 'raw_update', handler: ((upd: tl.TypeUpdate | tl.TypeMessage, peers: PeersIndex) => void)): this
/**
 * Register a parsed update handler
 *
 * @param name  Event name
 * @param handler  Raw update handler
 */
 on(name: 'update', handler: ((upd: ParsedUpdate) => void)): this\n`)

    updates.types.forEach((type) => {
        output.write(`/**
 * Register ${updates.toSentence(type, 'inline')}
 *
 * @param name  Event name
 * @param handler  ${updates.toSentence(type, 'full')}
 */
on(name: '${type.typeName}', handler: ((upd: ${type.updateType}) => void)): this\n`)
    })

    const printer = ts.createPrinter()

    const classContents = []

    state.methods.list.forEach(
        ({
            name: origName,
            // isPrivate,
            isManual,
            func,
            comment,
            aliases,
            overload,
            hasOverloads,
            available,
            rawApiMethods,
            dependencies,
        }) => {
            if (!available && !overload) {
                // no @available directive
                // try to determine it automatically
                const checkDepsAvailability = (deps) => {
                    return determineCommonAvailability(deps, (name) => {
                        const method = state.methods.list.find((it) => it.name === name && !it.overload)

                        if (!method) {
                            throwError(
                                func,
                                origName,
                                `Cannot determine availability of ${name}, is it a client method? Please use @available directive manually`,
                            )
                        }

                        if (method.available === null) {
                            return determineCommonAvailability([
                                determineCommonAvailability(method.rawApiMethods, findMethodAvailability),
                                checkDepsAvailability(method.dependencies),
                            ])
                        }

                        return method.available
                    })
                }

                available = determineCommonAvailability([
                    determineCommonAvailability(rawApiMethods, findMethodAvailability),
                    checkDepsAvailability(dependencies),
                ])
            }

            // create method that calls that function and passes `this`
            // first let's determine the signature
            const returnType = func.type ? ': ' + func.type.getText() : ''
            const generics = func.typeParameters ?
                `<${func.typeParameters.map((it) => it.getFullText()).join(', ')}>` :
                ''
            const rawParams = (func.parameters || []).filter(
                (it) => !it.type || it.type.getText() !== 'BaseTelegramClient',
            )
            const parameters = rawParams
                .map((it) => {
                    if (it.initializer) {
                        // has default value
                        it._savedDefault = it.initializer.getFullText()

                        if (!it.type) {
                            // no explicit type.
                            // infer from initializer
                            if (
                                it.initializer.kind === ts.SyntaxKind.TrueKeyword ||
                                it.initializer.kind === ts.SyntaxKind.FalseKeyword
                            ) {
                                it.type = { kind: ts.SyntaxKind.BooleanKeyword }
                            } else if (it.initializer.kind === ts.SyntaxKind.StringLiteral) {
                                it.type = { kind: ts.SyntaxKind.StringKeyword }
                            } else if (
                                it.initializer.kind === ts.SyntaxKind.NumericLiteral ||
                                (it.initializer.kind === ts.SyntaxKind.Identifier &&
                                    (it.initializer.escapedText === 'NaN' || it.initializer.escapedText === 'Infinity'))
                            ) {
                                it.type = { kind: ts.SyntaxKind.NumberKeyword }
                            } else {
                                throwError(it, state.methods.used[origName], 'Cannot infer parameter type')
                            }
                        }
                        it.initializer = undefined

                        const deleteParents = (obj) => {
                            if (Array.isArray(obj)) {
                                return obj.forEach((it) => deleteParents(it))
                            }

                            if (obj.parent) delete obj.parent

                            for (const k of Object.keys(obj)) {
                                if (obj[k] && typeof obj[k] === 'object') {
                                    deleteParents(obj[k])
                                }
                            }
                        }
                        deleteParents(it)

                        it.questionToken = { kind: ts.SyntaxKind.QuestionToken }

                        return printer.printNode(
                            ts.EmitHint.Unspecified,
                            it,
                            // state.files[state.methods.used[origName]]
                        )
                    }

                    return it.getFullText()
                })
                .join(', ')

            // remove @internal mark and set default values for parameters
            comment = comment
                .replace(/^\s*\/\/+\s*@(alias|available|manual).*$/gm, '')
                .replace(/(\n^|\/\*)\s*\*\s*@internal.*/m, '')
                .replace(/((?:\n^|\/\*)\s*\*\s*@param )([^\s]+?)($|\s+)/gm, (_, pref, arg, post) => {
                    const param = rawParams.find((it) => it.name.escapedText === arg)
                    if (!param) return _
                    if (!param._savedDefault) return _

                    return `${pref}[${arg}=${param._savedDefault.trim()}]${post}`
                })
                .replace(/(?<=\/\*.*)(?=\n\s*\*\s*(?:@[a-z]+|\/))/s, () => {
                    switch (available) {
                        case 'user':
                            return '\n * **Available**: 👤 users only\n *'
                        case 'bot':
                            return '\n * **Available**: 🤖 bots only\n *'
                        case 'both':
                            return '\n * **Available**: ✅ both users and bots\n *'
                    }

                    return ''
                })

            for (const name of [origName, ...aliases]) {
                if (!hasOverloads) {
                    if (!comment.match(/\/\*\*?\s*\*\//)) {
                        // empty comment, no need to write it
                        output.write(comment + '\n')
                    }

                    output.write(`${name}${generics}(${parameters})${returnType}\n`)
                }

                if (!overload && !isManual) {
                    if (hasOverloads) {
                        classContents.push('// @ts-expect-error .bind() kinda breaks typings for overloads')
                    }
                    classContents.push(`${name} = ${origName}.bind(null, this)`)
                }
            }
        },
    )
    output.write('}\n')

    output.write('\nexport { TelegramClientOptions }\n')
    output.write('\nexport class TelegramClient extends BaseTelegramClient {\n')

    state.fields.forEach(({ code }) => output.write(`protected ${code}\n`))

    output.write('constructor(opts: TelegramClientOptions) {\n')
    output.write('super(opts)\n')
    state.init.forEach((code) => {
        output.write(code + '\n')
    })
    output.write('}\n')

    classContents.forEach((line) => output.write(line + '\n'))
    output.write('}')

    // format the resulting file with prettier
    const targetFile = path.join(__dirname, '../src/client.ts')
    const prettierConfig = await prettier.resolveConfig(targetFile)
    let fullSource = await fs.promises.readFile(targetFile, 'utf-8')
    fullSource = await prettier.format(fullSource, {
        ...(prettierConfig || {}),
        filepath: targetFile,
    })
    await fs.promises.writeFile(targetFile, fullSource)

    // fix using eslint
    require('child_process').execSync(`pnpm exec eslint --fix ${targetFile}`, {
        stdio: 'inherit',
    })
}

main().catch(console.error)
