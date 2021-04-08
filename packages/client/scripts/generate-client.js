const ts = require('typescript')
const path = require('path')
const fs = require('fs')
const prettier = require('prettier')
// not the best way but who cares lol
const { createWriter } = require('../../tl/scripts/common')

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

    function getLeadingComments(ast) {
        return (ts.getLeadingCommentRanges(fileFullText, ast.pos) || [])
            .map((range) => fileFullText.substring(range.pos, range.end))
            .join('\n')
    }

    function checkForFlag(ast, flag) {
        return getLeadingComments(ast)
            .split('\n')
            .map((i) => i.replace(/^(\/\/|\s*\*+|\/\*\*+\s*)/g, '').trim())
            .some((i) => i.startsWith(flag))
    }

    for (const stmt of program.statements) {
        const isCopy = checkForFlag(stmt, '@copy')
        if (stmt.kind === ts.SyntaxKind.ImportDeclaration) {
            if (!isCopy) continue

            if (
                !stmt.importClause.namedBindings ||
                stmt.importClause.namedBindings.kind !== 264 /* NamedImports */
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

            const isPrivate = name[0] === '_'
            const isExported = (stmt.modifiers || []).find(
                (mod) => mod.kind === 92 /* ExportKeyword */
            )
            const isInitialize = checkForFlag(stmt, '@initialize')

            if (!isExported && !isPrivate) {
                throwError(
                    isExported,
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
            if (stmt.body) {
                state.methods.used[name] = relPath
            }

            if (isExported) {
                state.methods.list.push({
                    from: relPath,
                    name,
                    isPrivate,
                    func: stmt,
                    comment: getLeadingComments(stmt),
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
    const output = createWriter('../src/client.ts', __dirname)
    const state = {
        imports: {},
        fields: [],
        init: [],
        methods: {
            used: {},
            list: [],
        },
        copy: [],
    }

    for await (const file of getFiles(path.join(__dirname, '../src/methods'))) {
        if (!file.startsWith('.') && file.endsWith('.ts')) {
            await addSingleMethod(state, file)
        }
    }

    output.write(
        '/* THIS FILE WAS AUTO-GENERATED */\n' +
            "import { BaseTelegramClient } from '@mtcute/core'\n" +
            "import { tl } from '@mtcute/tl'"
    )
    Object.entries(state.imports).forEach(([module, items]) => {
        items = [...items]
        output.write(`import { ${items.sort().join(', ')} } from '${module}'`)
    })

    output.write()

    state.copy.forEach(({ from, code }) => {
        output.write(`// from ${from}\n${code}\n`)
    })

    output.write('\nexport class TelegramClient extends BaseTelegramClient {')
    output.tab()
    state.fields.forEach(({ from, code }) => {
        output.write(`// from ${from}\nprotected ${code}\n`)
    })

    output.write('constructor(opts: BaseTelegramClient.Options) {')
    output.tab()
    output.write('super(opts)')
    state.init.forEach((code) => {
        output.write(code)
    })
    output.untab()
    output.write('}\n')

    state.methods.list.forEach(({ name, isPrivate, func, comment }) => {
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
        const parameters = rawParams.map((it) => it.getFullText()).join(', ')

        // write comment, but remove @internal mark
        comment = comment.replace(/(\n^|\/\*)\s*\*\s*@internal.*/m, '')
        if (!comment.match(/\/\*\*?\s*\*\//))
            // empty comment, no need to write it
            output.write(comment)

        output.write(
            `${
                isPrivate ? 'protected ' : ''
            }${name}${generics}(${parameters})${returnType}${
                func.body
                    ? `{
return ${name}.apply(this, arguments)
}`
                    : ''
            }`
        )
    })
    output.untab()
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