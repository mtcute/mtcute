const ts = require('typescript')
const path = require('path')
const fs = require('fs')
const prettier = require('prettier')
const updates = require('./generate-updates')

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
${text}`
    )
    process.exit(0)
}

async function addSingleMethod(state, fileName) {
    const fileFullText = await fs.promises.readFile(fileName, 'utf-8')
    const program = ts.createSourceFile(
        path.basename(fileName),
        fileFullText,
        ts.ScriptTarget.ES2018,
        true
    )
    const relPath = path.relative(targetDir, fileName).replace(/\\/g, '/') // replace path delim to unix

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
        if (stmt.kind === ts.SyntaxKind.ImportDeclaration) {
            if (!isCopy) continue

            if (
                !stmt.importClause.namedBindings ||
                stmt.importClause.namedBindings.kind !== ts.SyntaxKind.NamedImports
            )
                throwError(stmt, fileName, 'Only named imports are supported!')

            let module = stmt.moduleSpecifier.text
            if (module[0] === '.') {
                // relative, need to resolve
                const modFullPath = path.join(
                    path.dirname(fileName),
                    stmt.moduleSpecifier.text
                )
                const modPath = path.dirname(modFullPath)
                const modName = path.basename(modFullPath)

                module = path
                    .join(path.relative(targetDir, modPath), modName)
                    .replace(/\\/g, '/') // replace path delim to unix
                if (module[0] !== '.') module = './' + module
            }

            if (module === './client') {
                throwError(
                    stmt,
                    fileName,
                    "You can't copy an import from ./client"
                )
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
                    `Function name "${name}" was already used in file ${state.methods.used[name]}`
                )
            }

            const isPrivate =
                name[0] === '_' &&
                name !== '_handleUpdate' &&
                name !== '_normalizeInputFile' &&
                name !== '_normalizeInputMedia'

            const isExported = (stmt.modifiers || []).find(
                (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
            )
            const isInitialize = checkForFlag(stmt, '@initialize')
            const aliases = (function () {
                const flag = checkForFlag(stmt, '@alias')
                if (!flag) return []

                const [, aliases] = flag.split('=')
                if (!aliases || !aliases.length) return []

                return aliases.split(',')
            })()

            if (!isExported && !isPrivate) {
                throwError(
                    stmt,
                    fileName,
                    'Public methods MUST be exported.'
                )
            }

            if (isExported && !checkForFlag(stmt, '@internal')) {
                throwError(
                    isExported,
                    fileName,
                    'Exported methods must be marked as @internal so TS compiler strips them away.'
                )
            }

            if (isInitialize && isExported) {
                throwError(
                    isExported,
                    fileName,
                    'Initialization methods must not be exported'
                )
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
            if (
                isExported &&
                (!firstArg ||
                    (firstArg.type.getText() !== 'TelegramClient' &&
                        firstArg.type.getText() !== 'BaseTelegramClient'))
            )
                throwError(
                    firstArg || stmt.name,
                    fileName,
                    `Exported methods must have \`BaseTelegramClient\` or \`TelegramClient\` as their first parameter`
                )

            const returnsExported = (stmt.body
                ? ts.getLeadingCommentRanges(fileFullText, stmt.body.pos + 2) ||
                  (stmt.statements &&
                      stmt.statements.length &&
                      ts.getLeadingCommentRanges(
                          fileFullText,
                          stmt.statements[0].pos
                      )) ||
                  []
                : []
            )
                .map((range) => fileFullText.substring(range.pos, range.end))
                .join('\n')
                .includes('@returns-exported')

            // overloads
            const isOverload = !stmt.body
            if (isOverload) {
                hasOverloads[name] = true
            } else {
                state.methods.used[name] = relPath
            }

            if (isExported) {
                state.methods.list.push({
                    from: relPath,
                    name,
                    isPrivate,
                    func: stmt,
                    comment: getLeadingComments(stmt),
                    aliases,
                    overload: isOverload,
                    hasOverloads: hasOverloads[name] && !isOverload,
                })

                const module = `./${relPath.replace(/\.ts$/, '')}`
                if (!(module in state.imports)) {
                    state.imports[module] = new Set()
                }

                state.imports[module].add(name)

                if (returnsExported) {
                    let returnType = stmt.type.getText()
                    let m = returnType.match(/^Promise<(.+)>$/)
                    if (m) returnType = m[1]
                    state.imports[module].add(returnType)
                }
            }
        } else if (stmt.kind === ts.SyntaxKind.InterfaceDeclaration) {
            if (isCopy) {
                state.copy.push({
                    from: relPath,
                    code: stmt.getText()
                })
                continue
            }

            if (!checkForFlag(stmt, '@extension')) continue
            const isExported = (stmt.modifiers || []).find(
                (mod) => mod.kind === 92 /* ExportKeyword */
            )

            if (isExported)
                throwError(
                    isExported,
                    fileName,
                    'Extension interfaces must not be imported'
                )
            if (stmt.heritageClauses && stmt.heritageClauses.length) {
                throwError(
                    stmt.heritageClauses[0],
                    fileName,
                    'Extension interfaces must not be extended'
                )
            }

            for (const member of stmt.members || []) {
                state.fields.push({
                    from: relPath,
                    code: member.getText(),
                })
            }
        } else if (isCopy) {
            state.copy.push({ from: relPath, code: stmt.getFullText().trim() })
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
        if (!file.startsWith('.') && file.endsWith('.ts')) {
            await addSingleMethod(state, file)
        }
    }

    output.write(
        '/* THIS FILE WAS AUTO-GENERATED */\n' +
            "import { BaseTelegramClient } from '@mtcute/core'\n" +
            "import { tl } from '@mtcute/tl'\n"
    )
    Object.entries(state.imports).forEach(([module, items]) => {
        items = [...items]
        output.write(`import { ${items.sort().join(', ')} } from '${module}'\n`)
    })

    output.write('\n')

    state.copy.forEach(({ from, code }) => {
        output.write(`// from ${from}\n${code}\n`)
    })

    output.write(
        '\nexport interface TelegramClient extends BaseTelegramClient {\n'
    )

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
            isPrivate,
            func,
            comment,
            aliases,
            overload,
            hasOverloads,
        }) => {
            // create method that calls that function and passes `this`
            // first let's determine the signature
            const returnType = func.type ? ': ' + func.type.getText() : ''
            const generics = func.typeParameters
                ? `<${func.typeParameters
                      .map((it) => it.getFullText())
                      .join(', ')}>`
                : ''
            const rawParams = (func.parameters || []).filter(
                (it) => !it.type || it.type.getText() !== 'TelegramClient'
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
                                it.initializer.kind ===
                                    ts.SyntaxKind.TrueKeyword ||
                                it.initializer.kind ===
                                    ts.SyntaxKind.FalseKeyword
                            ) {
                                it.type = { kind: ts.SyntaxKind.BooleanKeyword }
                            } else if (
                                it.initializer.kind ===
                                ts.SyntaxKind.StringLiteral
                            ) {
                                it.type = { kind: ts.SyntaxKind.StringKeyword }
                            } else if (
                                it.initializer.kind ===
                                    ts.SyntaxKind.NumericLiteral ||
                                (it.initializer.kind ===
                                    ts.SyntaxKind.Identifier &&
                                    (it.initializer.escapedText === 'NaN' ||
                                        it.initializer.escapedText ===
                                            'Infinity'))
                            ) {
                                it.type = { kind: ts.SyntaxKind.NumberKeyword }
                            } else {
                                throwError(
                                    it,
                                    state.methods.used[origName],
                                    'Cannot infer parameter type'
                                )
                            }
                        }
                        it.initializer = undefined

                        const deleteParents = (obj) => {
                            if (Array.isArray(obj))
                                return obj.forEach((it) => deleteParents(it))

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
                            it
                            // state.files[state.methods.used[origName]]
                        )
                    }

                    return it.getFullText()
                })
                .join(', ')

            // remove @internal mark and set default values for parameters
            comment = comment
                .replace(/^\s*\/\/+\s*@alias.*$/m, '')
                .replace(/(\n^|\/\*)\s*\*\s*@internal.*/m, '')
                .replace(
                    /((?:\n^|\/\*)\s*\*\s*@param )([^\s]+?)($|\s+)/gm,
                    (_, pref, arg, post) => {
                        const param = rawParams.find(
                            (it) => it.name.escapedText === arg
                        )
                        if (!param) return _
                        if (!param._savedDefault) return _
                        if (post) {
                            return `${pref}${arg}${post}(default: \`${param._savedDefault.trim()}\`) `
                        } else {
                            return `${pref}${arg}\n*  (default: \`${param._savedDefault.trim()}\`)`
                        }
                    }
                )

            for (const name of [origName, ...aliases]) {
                if (!isPrivate && !hasOverloads) {
                    if (!comment.match(/\/\*\*?\s*\*\//))
                        // empty comment, no need to write it
                        output.write(comment + '\n')

                    output.write(
                        `${name}${generics}(${parameters})${returnType}\n`
                    )
                }

                if (!overload) {
                    classContents.push(
                        `${isPrivate ? 'protected ' : ''}${name} = ${origName}`
                    )
                }
            }
        }
    )
    output.write('}\n')

    output.write(
        '/** @internal */\nexport class TelegramClient extends BaseTelegramClient {\n'
    )

    state.fields.forEach(({ code }) => output.write(`protected ${code}\n`))

    output.write('constructor(opts: BaseTelegramClient.Options) {\n')
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
}

main().catch(console.error)
