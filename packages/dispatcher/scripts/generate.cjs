const { types, toSentence, replaceSections, formatFile } = require('../../client/scripts/generate-updates.cjs')

function generateHandler() {
    const lines = []
    const names = ['RawUpdateHandler']

    // imports must be added manually because yeah

    types.forEach((type) => {
        lines.push(
            `export type ${type.handlerTypeName}Handler<T = ${type.context}` +
                `${type.state ? ', S = never' : ''}> = ParsedUpdateHandler<` +
                `'${type.typeName}', T${type.state ? ', S' : ''}>`,
        )
        names.push(`${type.handlerTypeName}Handler`)
    })

    replaceSections(
        'handler.ts',
        {
            codegen:
                lines.join('\n') + '\n\nexport type UpdateHandler = \n' + names.map((i) => `    | ${i}\n`).join(''),
        },
        __dirname,
    )
}

function generateDispatcher() {
    const lines = []
    const imports = ['UpdateHandler', 'RawUpdateHandler']

    types.forEach((type) => {
        imports.push(`${type.handlerTypeName}Handler`)

        lines.push(`
    /**
     * Register ${toSentence(type)} without any filters
     *
     * @param handler  ${toSentence(type, 'full')}
     * @param group  Handler group index
     */
    on${type.handlerTypeName}(handler: ${type.handlerTypeName}Handler${
    type.state ? `<${type.context}, State extends never ? never : UpdateState<State>>` : ''
}['callback'], group?: number): void

${
    type.state ?
        `
    /**
     * Register ${toSentence(type)} with a filter
     *
     * @param filter  Update filter
     * @param handler  ${toSentence(type, 'full')}
     * @param group  Handler group index
     */
    on${type.handlerTypeName}<Mod>(
        filter: UpdateFilter<${type.context}, Mod, State>,
        handler: ${type.handlerTypeName}Handler<filters.Modify<${
    type.context
}, Mod>, State extends never ? never : UpdateState<State>>['callback'],
        group?: number
    ): void
    ` :
        ''
}

    /**
     * Register ${toSentence(type)} with a filter
     *
     * @param filter  Update filter
     * @param handler  ${toSentence(type, 'full')}
     * @param group  Handler group index
     */
    on${type.handlerTypeName}<Mod>(
        filter: UpdateFilter<${type.context}, Mod>,
        handler: ${type.handlerTypeName}Handler<filters.Modify<${type.context}, Mod>${
    type.state ? ', State extends never ? never : UpdateState<State>' : ''
}>['callback'],
        group?: number
    ): void

    /** @internal */
    on${type.handlerTypeName}(filter: any, handler?: any, group?: number): void {
        this._addKnownHandler('${type.typeName}', filter, handler, group)
    }
`)
    })

    replaceSections(
        'dispatcher.ts',
        {
            codegen: lines.join('\n'),
            'codegen-imports':
                'import {\n' +
                imports
                    .sort()
                    .map((i) => `    ${i},\n`)
                    .join('') +
                "} from './handler.js'",
        },
        __dirname,
    )
}

async function main() {
    generateHandler()
    generateDispatcher()

    await formatFile('handler.ts', __dirname)
    await formatFile('dispatcher.ts', __dirname)
}

module.exports = { types, toSentence }

if (require.main === module) {
    main().catch(console.error)
}
