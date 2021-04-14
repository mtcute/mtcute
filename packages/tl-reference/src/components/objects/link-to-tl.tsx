import { Link as MuiLink } from '@material-ui/core'
import { Link } from 'gatsby'
import React from 'react'
import { ExtendedTlObject } from '../../types'


export function LinkToTl(name: string): React.ReactElement
export function LinkToTl(obj: ExtendedTlObject): React.ReactElement
export function LinkToTl(
    prefix: string,
    type: string,
    name: string
): React.ReactElement
export function LinkToTl(
    prefix: string | ExtendedTlObject,
    type?: string,
    name?: string
): React.ReactElement {
    if (typeof prefix !== 'string') {
        type = prefix.type
        name = prefix.name
        prefix = prefix.prefix
    }

    // this kind of invocation is used in parameters table and for return type
    if (!type && !name) {
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
        prefix = ''
        type = 'union'
        name = fullType
    }

    return (
        <MuiLink component={Link} to={`/${prefix}${type}/${name}`}>
            {prefix}
            {name}
        </MuiLink>
    )
}
