import { ExtendedTlObject } from '../../types'
import {
    createStyles,
    makeStyles,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@material-ui/core'
import { LinkToTl } from './link-to-tl'
import { Description } from '../page'
import React from 'react'

import { green, red, blue } from '@material-ui/core/colors'
import clsx from 'clsx'

const useStyles = makeStyles((theme) =>
    createStyles({
        table: {
            '& th, & td': {
                fontSize: 15,
            },
        },
        mono: {
            fontFamily: 'Fira Mono, Consolas, monospace',
        },
        bold: {
            fontWeight: 'bold',
        },
        changed: {
            fontWeight: 500,
            border: 'none',
            width: 100,
        },
        added: {
            backgroundColor:
                theme.palette.type === 'light' ? green[100] : green[900],
            color: theme.palette.type === 'light' ? green[900] : green[100],
        },
        modified: {
            backgroundColor:
                theme.palette.type === 'light' ? blue[100] : blue[900],
            color: theme.palette.type === 'light' ? blue[900] : blue[100],
        },
        removed: {
            backgroundColor:
                theme.palette.type === 'light' ? red[100] : red[900],
            color: theme.palette.type === 'light' ? red[900] : red[100],
        },
    })
)

export function ObjectParameters({
    obj,
    diff,
    history,
}: {
    obj: ExtendedTlObject
    diff?: boolean
    history?: boolean
}): JSX.Element {
    const classes = useStyles()

    return (
        <Table className={classes.table}>
            <TableHead>
                <TableRow>
                    {diff && <TableCell>Change</TableCell>}
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {obj.arguments.map((arg) => (
                    <TableRow key={arg.name} className={arg.className}>
                        {diff && (
                            <TableCell
                                className={clsx(
                                    classes.changed,
                                    classes[arg.changed!]
                                )}
                            >
                                {arg.changed}
                            </TableCell>
                        )}
                        <TableCell>
                            <code
                                className={
                                    !arg.optional &&
                                    arg.type !== '$FlagsBitField'
                                        ? classes.bold
                                        : undefined
                                }
                            >
                                {arg.name}
                            </code>
                        </TableCell>
                        <TableCell className={classes.mono}>
                            {arg.optional ? (
                                <span title={arg.predicate}>
                                    {LinkToTl(arg.type, history)}?
                                </span>
                            ) : (
                                LinkToTl(arg.type, history)
                            )}
                        </TableCell>
                        <Description
                            description={arg.description}
                            component={TableCell}
                        />
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
