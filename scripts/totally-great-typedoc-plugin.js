// typedoc plugin to fix up references to other packages, and also some other stuff
// based on https://github.com/nlepage/typedoc-plugin-resolve-crossmodule-references/blob/main/src/index.ts

const path = require('path')
const {
    Converter,
    Renderer,
    DeclarationReflection,
    SignatureReflection,
    ParameterReflection,
    TypeParameterReflection,
    makeRecursiveVisitor,
    ReferenceType,
    TypeScript: ts,
    ReflectionKind,
    DefaultTheme,
    Application,
} = require('typedoc')
const fs = require('fs')

const PACKAGES_DIR = path.join(__dirname, '..', 'packages')

function isReferenceType(type) {
    return type.type === 'reference'
}

function isReferenceTypeBroken(type) {
    return type.reflection == null && type.getSymbol() != null
}

function isTypedReflection(reflection) {
    return (
        reflection instanceof DeclarationReflection ||
        reflection instanceof SignatureReflection ||
        reflection instanceof ParameterReflection ||
        reflection instanceof TypeParameterReflection
    )
}

const defaultTheme = new DefaultTheme(new Renderer(new Application()))

function packageNameFromPath(path) {
    return path
        .slice(PACKAGES_DIR.length + 1)
        .split(/[/\\]/)[0]
}

function load(app) {
    // app.converter.on(Converter.EVENT_BEGIN, (ctx) => {
    //     const program = ctx.programs[0]
    //     const basePath = path.join(PACKAGES_DIR, packageNameFromPath(program.getRootFileNames()[0]))
    //
    //     for (const file of program.getSourceFiles()) {
    //         if (file.fileName.startsWith(basePath)) {
    //             let stmtsToRemove = []
    //             for (const stmt of file.statements) {
    //                 if (stmt.kind === ts.SyntaxKind.ExportDeclaration &&
    //                     stmt.moduleSpecifier &&
    //                     // we only want to remove re-exports from other packages
    //                     !stmt.moduleSpecifier.text.startsWith('.')
    //                 ) {
    //                     stmtsToRemove.push(stmt)
    //                 }
    //             }
    //             file.statements = file.statements.filter((stmt) => !stmtsToRemove.includes(stmt))
    //         }
    //     }
    // })

    app.converter.on(Converter.EVENT_RESOLVE, (ctx, reflection) => {
        recursivelyVisit(ctx, reflection, fixType)
    })
}

function recursivelyVisit(ctx, reflection, callback) {
    const project = ctx.project

    if (isTypedReflection(reflection)) {
        recursivelyVisitTypes(project, reflection, 'type', callback)
    }

    if (reflection instanceof DeclarationReflection) {
        recursivelyVisitTypes(project, reflection, 'extendedTypes', callback)
        recursivelyVisitTypes(project, reflection, 'implementedTypes', callback)
    }

    if (reflection.comment) {
        // maybe fix links in the comment
        let idx = 0

        for (const it of reflection.comment.summary) {
            if (it.tag === '@link') {
                const name = it.text
                // unlike normal references, here we don't have a symbol,
                // so we can only manually hardcode some known references
                let link = ''

                if (name.startsWith('tl.')) {
                    // todo link to tl reference
                    link = 'https://google.com'
                } else {
                    const [base, path] = name.split('.')

                    const knownClasses = {
                        TelegramClient: 'client',
                        ChosenInlineResult: 'client',
                        CallbackQuery: 'client',
                        Chat: 'client',
                        ChatMember: 'client',
                        ChatMemberUpdate: 'client',
                        Message: 'client',
                        UserStatusUpdate: 'client',
                        UserTypingUpdate: 'client',
                        PollVoteUpdate: 'client',
                        PollUpdate: 'client',
                        HistoryReadUpdate: 'client',
                        DeleteMessageUpdate: 'client',
                        ChatJoinRequestUpdate: 'client',
                        BotChatJoinRequestUpdate: 'client',
                        SessionConnection: 'core',
                    }

                    if (knownClasses[base]) {
                        // yay we know where that is
                        link = `/packages/client/${knownClasses[base]}/${base}.html`
                    }
                    if (path) link += `#${path}`
                }

                if (link) {
                    reflection.comment.summary[idx] = {
                        kind: 'text',
                        text: `[${name}](${link})`,
                    }
                }
            }

            idx += 1
        }
    }
}

function recursivelyVisitTypes(project, typed, field, callback) {
    fixTyped(project, typed, field, callback)

    const typedField = typed[field]
    if (!typedField) return

    const visitor = makeRecursiveVisitor({
        array(type) {
            fixTyped(project, type, 'elementType', callback)
        },
        conditional(type) {
            fixTyped(project, type, 'checkType', callback)
            fixTyped(project, type, 'trueType', callback)
            fixTyped(project, type, 'falseType', callback)
            fixTyped(project, type, 'extendsType', callback)
        },
        indexedAccess(type) {
            fixTyped(project, type, 'indexType', callback)
            fixTyped(project, type, 'objectType', callback)
        },
        intersection(type) {
            fixTyped(project, type, 'types', callback)
        },
        mapped(type) {
            fixTyped(project, type, 'nameType', callback)
            fixTyped(project, type, 'parameterType', callback)
            fixTyped(project, type, 'templateType', callback)
        },
        'named-tuple-member'(type) {
            fixTyped(project, type, 'element', callback)
        },
        optional(type) {
            fixTyped(project, type, 'elementType', callback)
        },
        predicate(type) {
            fixTyped(project, type, 'targetType', callback)
        },
        query(type) {
            fixTyped(project, type, 'queryType', callback)
        },
        reference(type) {
            fixTyped(project, type, 'typeArguments', callback)
        },
        reflection(type) {
            fixTyped(project, type.declaration, 'type', callback)
        },
        rest(type) {
            fixTyped(project, type, 'elementType', callback)
        },
        tuple(type) {
            fixTyped(project, type, 'elements', callback)
        },
        // FIXME template-literal?
        typeOperator(type) {
            fixTyped(project, type, 'target', callback)
        },
        union(type) {
            fixTyped(project, type, 'types', callback)
        },
    })

    if (Array.isArray(typedField)) {
        typedField.forEach((type) => type.visit && type.visit(visitor))
    } else {
        typedField.visit(visitor)
    }
}

function fixTyped(project, typed, field, callback) {
    const typedField = typed[field]
    if (!typedField) return

    if (Array.isArray(typedField)) {
        typedField.forEach((iType, i) => {
            typedField[i] = callback(project, iType)
        })
    } else {
        typed[field] = callback(project, typedField)
    }
}

function fixType(project, type) {
    if (isReferenceType(type) && isReferenceTypeBroken(type)) { return findReferenceType(type, project) }

    return type
}

function getNamespacedName(symbol) {
    if (!symbol.parent) return symbol.name.text

    let parts = [symbol.name.text]

    while (symbol.parent) {
        symbol = symbol.parent

        if (symbol.kind === ts.SyntaxKind.ModuleDeclaration) {
            parts.push(symbol.name.text)
        }
    }

    return parts.reverse().join('.')
}

findReferenceType._reflections = {}

function findReferenceType(type, project) {
    const symbol = type.getSymbol()?.getDeclarations()?.[0]
    const pkgFileName = symbol.getSourceFile().fileName
    if (!pkgFileName) return type

    if (pkgFileName.startsWith(PACKAGES_DIR)) {
        const pkgName = packageNameFromPath(pkgFileName)

        const namespacedName = getNamespacedName(symbol)
        const qualifiedName = `${pkgName}:${namespacedName}`
        let reflection = findReferenceType._reflections[qualifiedName]

        if (!reflection && pkgName === 'tl') {
            reflection = new DeclarationReflection(namespacedName, ReflectionKind.Reference, project)
            reflection.$tl = true
            project.registerReflection(reflection)

            // todo link to TL reference
            // reflection.url = '...'
        }

        if (!reflection) {
            let kind = {
                [ts.SyntaxKind.TypeAliasDeclaration]: ReflectionKind.TypeAlias,
                [ts.SyntaxKind.InterfaceDeclaration]: ReflectionKind.Interface,
                [ts.SyntaxKind.ClassDeclaration]: ReflectionKind.Class,
                [ts.SyntaxKind.EnumDeclaration]: ReflectionKind.Enum,
                [ts.SyntaxKind.FunctionDeclaration]: ReflectionKind.Function,
                [ts.SyntaxKind.ModuleDeclaration]: ReflectionKind.Namespace,
            }[symbol.kind]

            if (!kind) {
                return type
            }

            reflection = new DeclarationReflection(qualifiedName, kind, project)
            project.registerReflection(reflection)

            // awesome hack
            reflection.name = namespacedName
            const urls = defaultTheme.buildUrls(reflection, [])

            if (!urls[0]) {
                throw new Error(`No url for ${qualifiedName}`)
            }

            reflection.name = qualifiedName
            // reflection.url = path.join(`../${pkgName}/index.html`)

            const prefix = determineUrlPrefix(pkgFileName, symbol)
            if (prefix === null) return type

            reflection.url = path.join(`../${pkgName}/${urls[0].url}`)

            if (prefix) {
                reflection.url = reflection.url.replace(
                    /\/([^/]+?)\.html$/,
                    `/${prefix}$1.html`,
                )
            }
        }

        findReferenceType._reflections[qualifiedName] = reflection

        const newType = ReferenceType.createResolvedReference(
            qualifiedName,
            reflection,
            project,
        )

        if (type.typeArguments) {
            newType.typeArguments = type.typeArguments
        }

        return newType
    }

    return type
}

function* walkDirectory(dir) {
    const dirents = fs.readdirSync(dir, { withFileTypes: true })

    for (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name)

        if (dirent.isDirectory()) {
            yield* walkDirectory(res)
        } else {
            yield res
        }
    }
}

function getModuleExports(module, filename, prefix = '') {
    let exports = []

    for (const statement of module.statements) {
        if (statement.kind === ts.SyntaxKind.ExportDeclaration) {
            const exportDeclaration = statement

            if (
                exportDeclaration.exportClause &&
                exportDeclaration.exportClause.kind ===
                    ts.SyntaxKind.NamedExports
            ) {
                // export default sucks and we don't use it here
                for (const specifier of exportDeclaration.exportClause
                    .elements) {
                    exports.push(specifier.name.getText())
                }
            } else if (
                !exportDeclaration.exportClause &&
                exportDeclaration.moduleSpecifier
            ) {
                // export * from ...
                exports.push(
                    ...getFileExports(
                        path.resolve(
                            path.dirname(filename),
                            exportDeclaration.moduleSpecifier.text,
                        ),
                    ),
                )
            }
        }

        if (
            Array.isArray(statement.modifiers) &&
            statement.modifiers.some(
                (m) => m.kind === ts.SyntaxKind.ExportKeyword,
            )
        ) {
            if (statement.declarationList) {
                for (const decl of statement.declarationList.declarations) {
                    exports.push(decl.name.getText())
                }
            } else if (statement.name) {
                exports.push(statement.name.getText())
            }
        }

        if (statement.kind === ts.SyntaxKind.ModuleDeclaration) {
            exports.push(
                ...getModuleExports(statement.body, filename, `${statement.name.text}.`),
            )
        }
    }

    if (prefix) exports = exports.map((e) => `${prefix}${e}`)

    return exports
}

getFileExports._cache = {}

function getFileExports(filename) {
    if (!filename.endsWith('.ts')) {
        // could either be a .ts file or a directory with index.ts file
        const indexFilename = path.join(filename, 'index.ts')

        if (fs.existsSync(indexFilename)) {
            filename = indexFilename
        } else if (fs.existsSync(filename + '.ts')) {
            filename += '.ts'
        } else {
            return []
        }
    }

    if (getFileExports._cache[filename]) return getFileExports._cache[filename]

    const sourceFile = ts.createSourceFile(
        filename,
        fs.readFileSync(filename, 'utf8'),
        ts.ScriptTarget.ES2015,
        true,
    )

    const exports = getModuleExports(sourceFile, filename)

    getFileExports._cache[filename] = exports

    return exports
}

determineUrlPrefix._cache = {}

function determineUrlPrefix(pkgFileName, symbol) {
    const cacheKey = `${pkgFileName}!${symbol.getSourceFile().fileName}@${
        symbol.pos
    }`

    if (cacheKey in determineUrlPrefix._cache) {
        return determineUrlPrefix._cache[cacheKey]
    }

    const pkgName = packageNameFromPath(pkgFileName)

    const packageJsonFile = path.join(PACKAGES_DIR, pkgName, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'))

    if (packageJson.name !== '@mtcute/' + pkgName) {
        throw new Error(`could not find package.json for ${pkgName}`)
    }

    const tdConfig = require(path.join(PACKAGES_DIR, pkgName, 'typedoc.js'))

    const symbolName = getNamespacedName(symbol)

    let entryPoint

    switch (tdConfig.entryPointStrategy) {
        case 'expand': {
            const possiblePoints = []

            for (const dir of tdConfig.entryPoints) {
                const fullDir = path.join(PACKAGES_DIR, pkgName, dir)

                for (const file of walkDirectory(fullDir)) {
                    const exports = getFileExports(file)

                    if (exports.includes(symbolName)) {
                        possiblePoints.push(path.relative(fullDir, file))
                        break
                    }
                }
            }

            if (possiblePoints.length) {
                // shortest one wins
                entryPoint = possiblePoints.sort((a, b) => {
                    return a.match(/[/\\]/g).length - b.match(/[/\\]/g).length
                })[0]
            }

            break
        }
        case undefined:
        case 'resolve':
            for (const file of tdConfig.entryPoints) {
                const exports = getFileExports(
                    path.join(PACKAGES_DIR, pkgName, file),
                )

                if (exports.includes(symbolName)) {
                    entryPoint = file
                    break
                }
            }
            break
        default:
            throw new Error(
                `Unsupported entryPointStrategy: ${tdConfig.entryPointStrategy}`,
            )
    }

    if (!entryPoint) {
        console.warn(
            `warning: could not find entry point for ${symbolName}`,
        )

        return null
    }

    let prefix

    if (entryPoint.endsWith('index.ts')) {
        // exported from root namespace, no prefix thus
        prefix = ''
    } else {
        prefix = entryPoint.replace(/\.ts$/, '').replace(/[/\\]/g, '') + '.'
    }

    determineUrlPrefix._cache[cacheKey] = prefix

    return prefix
}

module.exports = { load }
