import { ExtendedTlObject } from '../../types'
import React, { ReactNode } from 'react'
import { useCodeArea } from '../../hooks/use-code-area'

export function ObjectTsCode({
    obj,
    children,
}: {
    obj: ExtendedTlObject
    children?: ExtendedTlObject[]
}): JSX.Element {
    const code = useCodeArea()

    const entities: ReactNode[] = []
    if (obj.type === 'union') {
        entities.push(
            code.keyword('export type'),
            ' ',
            code.identifier(obj.ts),
            ' ='
        )

        children!.forEach((it) => {
            const ns =
                it.namespace === '$root'
                    ? it.prefix === 'mtproto/'
                        ? 'mtproto.'
                        : ''
                    : it.namespace + '.'

            entities.push('\n    | ', code.typeName(`tl.${ns}${it.ts}`))
        })
    } else {
        entities.push(
            code.keyword('export interface'),
            ' ',
            code.identifier(obj.ts),
            ' {\n    ',
            code.property('_'),
            ': ',
            code.string(
                `'${obj.prefix === 'mtproto/' ? 'mt_' : ''}${obj.name}'`
            )
        )

        obj.arguments.forEach((arg) => {
            if (arg.type === '$FlagsBitField') {
                return entities.push(
                    code.comment(
                        `\n    // ${arg.name}: TlFlags // handled automatically`
                    )
                )
            }

            entities.push(
                '\n    ',
                code.property(arg.name),
                `${arg.optional ? '?' : ''}: `,
                code.typeName(arg.ts)
            )

            if (arg.predicate) {
                entities.push(
                    ' ',
                    code.comment('// present if ' + arg.predicate)
                )
            }
        })

        entities.push('\n}')
    }

    return code.code(entities)

    // const typeName = (s: string): string => {
    //     if (
    //         s === 'string' ||
    //         s === 'number' ||
    //         s === 'boolean' ||
    //         s === 'true'
    //     ) {
    //         return keyword(s)
    //     }
    //
    //     if (s.substr(s.length - 2) === '[]')
    //         return typeName(s.substr(0, s.length - 2)) + '[]'
    //
    //     return s.split('.').map(identifier).join('.')
    // }
    //
    // let html
    // if (obj.type === 'union') {
    //     html = `${keyword('export type')} ${identifier(obj.ts)} =`
    //     html += children!
    //         .map((it) => {
    //             const ns =
    //                 it.namespace === '$root'
    //                     ? it.prefix === 'mtproto/'
    //                         ? 'mtproto.'
    //                         : ''
    //                     : it.namespace + '.'
    //
    //             return `\n    | ${typeName(`tl.${ns}${it.ts}`)}`
    //         })
    //         .join('')
    // } else {
    //     html = `${keyword('export interface')} ${identifier(obj.ts)} {`
    //     html += `\n    ${property('_')}: `
    //     html += _string(
    //         `'${obj.prefix === 'mtproto/' ? 'mt_' : ''}${obj.name}'`
    //     )
    //     html += obj.arguments
    //         .map((arg) => {
    //             if (arg.type === '$FlagsBitField') {
    //                 return comment(
    //                     `\n    // ${arg.name}: TlFlags // handled automatically`
    //                 )
    //             }
    //
    //             const opt = arg.optional ? '?' : ''
    //             const comm = arg.predicate
    //                 ? ' ' + comment('// present if ' + arg.predicate)
    //                 : ''
    //
    //             const typ = typeName(arg.ts)
    //             return `\n    ${property(arg.name)}${opt}: ${typ}${comm}`
    //         })
    //         .join('')
    //     html += '\n}'
    // }
    //
    // return (
    //     <pre
    //         className={classes.code}
    //         dangerouslySetInnerHTML={{ __html: html }}
    //     />
    // )
}
