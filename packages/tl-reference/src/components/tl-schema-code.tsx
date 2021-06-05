import { useCodeArea } from '../hooks/use-code-area'
import { ReactNode } from 'react'
import { Link } from 'gatsby'
import React from 'react'

const LineRegex = /^(.+?)(?:#([0-f]{1,8}))?(?: \?)?(?: {(.+?:.+?)})? ((?:.+? )*)= (.+);$/

export function TlSchemaCode({ tl }: { tl: string }) {
    const code = useCodeArea()

    const highlightType = (s: string): ReactNode[] => {
        if (
            s === '#' ||
            s === 'int' ||
            s === 'long' ||
            s === 'double' ||
            s === 'string' ||
            s === 'bytes'
        )
            return [code.keyword(s)]
        if (s.match(/^[Vv]ector<(.+?)>$/)) {
            return [
                code.identifier(s.substr(0, 6)),
                '<',
                ...highlightType(s.substring(7, s.length - 1)),
                '>',
            ]
        }

        return [<Link to={`/history/union/${s}`}>{code.identifier(s)}</Link>]
    }

    let inTypes = true
    const entities: ReactNode[] = []

    tl.split('\n').forEach((line) => {
        if (line.match(/^\/\//)) {
            return entities.push(code.comment(line + '\n'))
        }

        let m
        if ((m = line.match(LineRegex))) {
            const [, fullName, typeId, generics, args, type] = m

            entities.push(
                <Link to={`/history/${inTypes ? 'class' : 'method'}/${fullName}`}>
                    {code.identifier(fullName)}
                </Link>
            )
            if (typeId) {
                entities.push('#', code.string(typeId))
            }

            if (generics) {
                entities.push(' {')
                generics.split(' ').forEach((pair) => {
                    const [name, type] = pair.trim().split(':')
                    entities.push(
                        code.property(name),
                        ':',
                        code.identifier(type)
                    )
                })
                entities.push('}')
            }

            if (args) {
                if (args.trim().match(/\[ [a-z]+ ]/i)) {
                    // for generics
                    entities.push(' ', code.comment(args.trim()))
                } else {
                    const parsed = args
                        .trim()
                        .split(' ')
                        .map((j) => j.split(':'))

                    if (parsed.length) {
                        parsed.forEach(([name, typ]) => {
                            const [predicate, type] = typ.split('?')

                            if (!type) {
                                return entities.push(
                                    ' ',
                                    code.property(name),
                                    ':',
                                    ...highlightType(predicate)
                                )
                            }

                            return entities.push(
                                ' ',
                                code.property(name),
                                ':',
                                code.string(predicate),
                                '?',
                                ...highlightType(type)
                            )
                        })
                    }
                }
            }

            entities.push(
                ' = ',
                <Link to={`/history/union/${type}`}>{code.identifier(type)}</Link>
            )

            entities.push(';\n')
            return
        }

        if (line.match(/^---(functions|types)---$/)) {
            inTypes = line === '---types---'
            return entities.push(code.keyword(line + '\n'))
        }

        // unable to highlight
        return entities.push(line + '\n')
    })

    return code.code(entities)
}
