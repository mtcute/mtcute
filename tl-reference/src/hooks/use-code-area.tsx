import { createStyles, makeStyles } from '@material-ui/core'
import React, { ReactNode } from 'react'

const useStyles = makeStyles((theme) =>
    createStyles({
        // theme ported from one dark
        code: {
            fontFamily: 'Iosevka SS05, Fira Mono, Consolas, monospace',
            background: '#282c34',
            color: '#bbbbbb',
            fontSize: 16,
            borderRadius: 4,
            overflowX: 'auto',
            padding: 8,

            '& a': {
                textDecoration: 'none'
            }
        },
        keyword: {
            fontStyle: 'italic',
            color: '#c678dd',
        },
        identifier: {
            color: '#e5c07b',
        },
        property: {
            color: '#e06c75',
        },
        comment: {
            color: '#5c6370',
        },
        string: {
            color: '#98c379',
        },
    })
)

export function useCodeArea() {
    const classes = useStyles()

    const keyword = (s: ReactNode) => (
        <span className={classes.keyword}>{s}</span>
    )

    const identifier = (s: ReactNode) => (
        <span className={classes.identifier}>{s}</span>
    )

    const property = (s: ReactNode) => (
        <span className={classes.property}>{s}</span>
    )

    const comment = (s: ReactNode) => (
        <span className={classes.comment}>{s}</span>
    )

    const string = (s: ReactNode) => <span className={classes.string}>{s}</span>

    const typeName = (s: string): ReactNode => {
        if (
            s === 'string' ||
            s === 'number' ||
            s === 'boolean' ||
            s === 'any' ||
            s === 'true'
        ) {
            return keyword(s)
        }

        if (s.substr(s.length - 2) === '[]')
            return [typeName(s.substr(0, s.length - 2)), '[]']

        const ret: ReactNode[] = []
        s.split('.').forEach((it, idx) => {
            if (idx !== 0) ret.push('.')
            ret.push(identifier(it))
        })
        return ret
    }

    const code = (s: ReactNode) => <pre className={classes.code}>{s}</pre>

    return {
        keyword,
        identifier,
        property,
        comment,
        string,
        typeName,
        code,
    }
}
