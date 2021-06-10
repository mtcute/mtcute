import { Link as MuiLink } from '@material-ui/core'
import { Link } from 'gatsby'
import React from 'react'
import { ExtendedTlObject } from '../../types'


export function LinkToTl(name: string, history?: boolean): React.ReactElement
export function LinkToTl(obj: ExtendedTlObject, history?: boolean): React.ReactElement
export function LinkToTl(
    prefix: string,
    type: string,
    name: string,
    history?: boolean
): React.ReactElement
export function LinkToTl(
    prefix: string | ExtendedTlObject,
    type?: string | boolean,
    name?: string,
    history?: boolean
): React.ReactElement {
    if (typeof prefix !== 'string') {
        history = !!type
        type = prefix.type
        name = prefix.name
        prefix = prefix.prefix
    }

    // this kind of invocation is used in parameters table and for return type
    if ((!type || typeof type === 'boolean') && !name) {
        const fullType = prefix

        // core types
        if (
            fullType === 'number' ||
            fullType === 'Long' ||
            fullType === 'Int128' ||
            fullType === 'Int256' ||
            fullType === 'Double' ||
            fullType === 'string' ||
            fullType === 'Buffer' ||
            fullType === 'boolean' ||
            fullType === 'true' ||
            fullType === 'any' ||
            fullType === '$FlagsBitField'
        ) {
            return (
                <MuiLink component={Link} to="/#core-types">
                    {fullType === '$FlagsBitField' ? 'TlFlags' : fullType}
                </MuiLink>
            )
        }

        // array
        if (fullType.substr(fullType.length - 2) === '[]') {
            return <>{LinkToTl(fullType.substr(0, fullType.length - 2))}[]</>
        }

        // must be union since this is from parameters type
        history = !!type
        prefix = ''
        type = 'union'
        name = fullType
    }

    if (history) type = 'history/' + type

    return (
        <MuiLink component={Link} to={`/${prefix}${type}/${name}`}>
            {prefix}
            {name}
        </MuiLink>
    )
}
