import { graphql } from 'gatsby'
import React from 'react'
import { ExtendedTlObject } from '../types'
import { Page, Section, usePageStyles } from '../components/page'
import {
    Link as MuiLink,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@material-ui/core'
import { LinkToTl } from '../components/objects/link-to-tl'

interface Data {
    classes: { nodes: ExtendedTlObject[] }
    arguments: { nodes: ExtendedTlObject[] }
}

export default function NoDescriptionPage({ data }: { data: Data }) {
    const classes = usePageStyles()

    // i dont care
    const args: any[] = []
    data.arguments.nodes.forEach((node) => {
        if (node.arguments) {
            node.arguments.forEach((arg) => {
                if (arg.description === null) {
                    ;(arg as any).node = node
                    args.push(arg)
                }
            })
        }
    })

    return (
        <Page
            toc={[
                { id: 'types', title: 'Types' },
                { id: 'arguments', title: 'Arguments' },
            ]}
        >
            <div className={classes.heading1}>
                <Typography variant="h3" id="tl-reference">
                    No description
                </Typography>
                <Typography variant="body2">
                    {data.classes.nodes.length} types, {args.length} arguments
                </Typography>
            </div>
            <Typography variant="body1" className={classes.paragraph}>
                This page lists all items (types and their arguments) from the
                schema that currently do not have a description, neither
                official nor unofficial. You can improve this reference by
                adding description to missing items in{' '}
                <MuiLink href="https://github.com/teidesu/mtcute/blob/master/packages/tl/descriptions.yaml">
                    descriptions.yaml
                </MuiLink>
                .
            </Typography>
            <Section id="types" title="Types">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>
                                <MuiLink href="https://github.com/teidesu/mtcute/blob/master/packages/tl/descriptions.yaml">
                                    descriptions.yaml
                                </MuiLink>{' '}
                                key
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.classes.nodes.map((node) => (
                            <TableRow key={node.id}>
                                <TableCell>
                                    {node.type === 'method'
                                        ? 'Method'
                                        : node.type === 'union'
                                        ? 'Union'
                                        : 'Class'}
                                </TableCell>
                                <TableCell>{LinkToTl(node)}</TableCell>
                                <TableCell>
                                    {(node.type === 'method' ? 'm_' : 'o_') +
                                        (node.prefix === 'mtproto/'
                                            ? 'mt_'
                                            : '') +
                                        (node.type === 'union'
                                            ? node.name
                                            : node.underscore)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Section>
            <Section id="arguments" title="Arguments">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>
                                <MuiLink href="https://github.com/teidesu/mtcute/blob/master/packages/tl/descriptions.yaml">
                                    descriptions.yaml
                                </MuiLink>{' '}
                                key
                            </TableCell>
                            <TableCell>Argument</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {args.map((arg) => (
                            <TableRow key={arg.node.id + arg.name}>
                                <TableCell>
                                    {arg.node.type === 'method'
                                        ? 'Method'
                                        : arg.node.type === 'union'
                                        ? 'Union'
                                        : 'Class'}
                                </TableCell>
                                <TableCell>{LinkToTl(arg.node)}</TableCell>
                                <TableCell>
                                    {(arg.node.type === 'method'
                                        ? 'm_'
                                        : 'o_') +
                                        (arg.node.prefix === 'mtproto/'
                                            ? 'mt_'
                                            : '') +
                                        (arg.node.type === 'union'
                                            ? arg.node.name
                                            : arg.node.underscore)}
                                </TableCell>
                                <TableCell>
                                    <code>{arg.name}</code>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Section>
        </Page>
    )
}

export const query = graphql`
    query {
        classes: allTlObject(filter: { description: { eq: null } }) {
            nodes {
                id
                prefix
                type
                name
                underscore
            }
        }
        arguments: allTlObject(
            filter: { arguments: { elemMatch: { description: { eq: null } } } }
        ) {
            nodes {
                id
                prefix
                type
                name
                underscore
                arguments {
                    name
                    type
                    description
                }
            }
        }
    }
`
