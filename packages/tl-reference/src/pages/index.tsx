import React from 'react'
import { Link as MuiLink, Typography } from '@material-ui/core'
import { Page, usePageStyles } from '../components/page'
import { graphql, Link } from 'gatsby'

interface Data {
    mtClasses: { totalCount: number }
    classes: { totalCount: number }
    mtMethods: { totalCount: number }
    methods: { totalCount: number }
    mtUnions: { totalCount: number }
    unions: { totalCount: number }

    clsWithDesc: { totalCount: number }
    clsWithoutDesc: { totalCount: number }
    argWithDesc: {
        totalCount: number
        nodes: { arguments: { description: string | null }[] }[]
    }
    argWithoutDesc: {
        totalCount: number
        nodes: { arguments: { description: string | null }[] }[]
    }

    updated: {
        nodes: [
            {
                layer: number
                source: {
                    date: string
                    commit: string
                    file: string
                }
            }
        ]
    }
}

function countMissingDescriptionArguments(
    item: Data['argWithDesc'],
    eqNull: boolean
) {
    let count = 0
    item.nodes.forEach((node) =>
        node.arguments?.forEach((arg) => {
            if (eqNull ? arg.description === null : arg.description !== null)
                count += 1
        })
    )
    item.totalCount = count
}

export default function IndexPage({ data }: { data: Data }) {
    const classes = usePageStyles()

    countMissingDescriptionArguments(data.argWithoutDesc, true)
    countMissingDescriptionArguments(data.argWithDesc, false)

    return (
        <Page
            toc={[
                { id: 'tl-reference', title: 'TL Reference' },
                { id: 'types', title: 'Types' },
                { id: 'core-types', title: 'Core types' },
                { id: 'statistics', title: 'Statistics' },
            ]}
        >
            <div className={classes.heading1}>
                <Typography variant="h3" id="tl-reference">
                    TL Reference
                </Typography>
                <Typography variant="body2">
                    layer {data.updated.nodes[0].layer} / updated{' '}
                    {data.updated.nodes[0].source.date}
                </Typography>
            </div>
            <Typography variant="body1" className={classes.paragraph}>
                This web application allows easily browsing through myriads of
                TL objects and reading through their documentation. Unlike{' '}
                <MuiLink href="//core.telegram.org/schema">
                    official documentation
                </MuiLink>
                , this app has simpler structure, search and nice interface.
            </Typography>
            <Typography variant="body1" className={classes.paragraph}>
                Even though this reference is intended to be used with{' '}
                <MuiLink href="//github.com/teidesu/mtcute">MTCute</MuiLink>{' '}
                library, the objects are common to any other MTProto library.
                The key difference is that MTCute (and this reference) use{' '}
                <code>camelCase</code> for arguments, while the original schema
                and some other libraries use <code>snake_case</code>.
            </Typography>
            <Typography variant="h4" id="types" className={classes.heading}>
                Types
            </Typography>
            <Typography variant="body1" className={classes.paragraph}>
                In TL, there are 3 main groups of types: <i>Classes</i>,{' '}
                <i>Methods</i> and Unions (officially they are called{' '}
                <i>constructors</i>, <i>methods</i> and <i>types</i>{' '}
                respectively).
            </Typography>
            <Typography variant="body1" className={classes.paragraph}>
                <i>Classes</i> and <i>Methods</i> are simply typed objects, that
                contain some data. The only difference is that Methods are used
                in RPC calls (i.e. they are sent to the server), and Classes are
                used inside methods, or sent by the server back (either as an
                RPC result, or as an update).
            </Typography>
            <Typography variant="body1" className={classes.paragraph}>
                <i>Union</i> is a type that combines multiple <i>Classes</i> in
                one type. In some languages, this can be represented as an
                abstract class. <i>Unions</i> are sent by Telegram in response
                to RPC results, as well as they are used as arguments for other{' '}
                <i>Classes</i> or <i>Methods</i>.
            </Typography>
            <Typography variant="body1" className={classes.paragraph}>
                In TL, every single <i>Class</i> is a part of exactly one{' '}
                <i>Union</i>, and every <i>Union</i> contains at least one{' '}
                <i>Class</i>.
            </Typography>
            <Typography variant="body1" className={classes.paragraph}>
                In MTCute, all types are exposed as a namespace <code>tl</code>{' '}
                of package <code>@mtcute/tl</code>. By design, we use immutable
                plain objects with type discriminator to represent{' '}
                <i>Classes</i> and <i>Methods</i>, and TypeScript unions to
                represent <i>Unions</i>.<br />
                To differentiate between different groups of types, we use
                different naming for each of them:
            </Typography>
            <Typography
                variant="body1"
                className={classes.paragraph}
                component="ul"
            >
                <li>
                    <i>Classes</i> are prefixed with <code>Raw</code> (e.g.{' '}
                    <code>tl.RawMessage</code>)
                </li>
                <li>
                    Additionally, <i>Methods</i> are postfixed with{' '}
                    <code>Request</code> and (e.g.{' '}
                    <code>tl.RawGetMessageRequest</code>)
                </li>
                <li>
                    Finally, <i>Unions</i> are simply prefixed with{' '}
                    <code>Type</code> (e.g. <code>tl.TypeUser</code>)
                </li>
            </Typography>
            <Typography
                variant="h4"
                id="core-types"
                className={classes.heading}
            >
                Core types
            </Typography>
            <Typography variant="body1" className={classes.paragraph}>
                Core types are basic built-in types that are used in TL schema.
                Quick reference:
            </Typography>
            <Typography
                variant="body1"
                className={classes.paragraph}
                component="ul"
            >
                <li>
                    <code>number</code>: 32-bit signed integer
                </li>
                <li>
                    <code>Long</code>: 64-bit signed integer
                </li>
                <li>
                    <code>Int128</code>: 128-bit signed integer (only used for
                    MTProto)
                </li>
                <li>
                    <code>Int256</code>: 256-bit signed integer (only used for
                    MTProto)
                </li>
                <li>
                    <code>Double</code>: 64-bit floating point value
                </li>
                <li>
                    <code>string</code>: UTF-16 string (strings in JS are also
                    UTF-16)
                </li>
                <li>
                    <code>Buffer</code>: Byte array of a known size
                </li>
                <li>
                    <code>boolean</code>: One-byte boolean value (true/false)
                </li>
                <li>
                    <code>true</code>: Zero-size <code>true</code> value, used
                    for TL flags
                </li>
                <li>
                    <code>any</code>: Any other TL object (usually another
                    method)
                </li>
                <li>
                    <code>T[]</code>: Array of <code>T</code>
                </li>
                <li>
                    <code>TlFlags</code>: 32-bit signed value representing
                    object's TL flags
                </li>
            </Typography>
            <Typography
                variant="h4"
                className={classes.heading}
                id="statistics"
            >
                Statistics
            </Typography>
            <Typography
                variant="body1"
                className={classes.paragraph}
                component="ul"
            >
                <li>
                    Generated from layer <b>{data.updated.nodes[0].layer}</b>{' '}
                    (last updated <b>{data.updated.nodes[0].source.date}</b>,
                    commit{' '}
                    <MuiLink
                        href={`https://github.com/telegramdesktop/tdesktop/blob/${data.updated.nodes[0].source.commit}/${data.updated.nodes[0].source.file}`}
                        target="_blank"
                    >
                        {data.updated.nodes[0].source.commit.substr(0, 7)}
                    </MuiLink>
                    )
                </li>
                <li>
                    Current schema contains{' '}
                    <b>
                        {data.methods.totalCount +
                            data.classes.totalCount +
                            data.unions.totalCount}
                    </b>{' '}
                    types (+{' '}
                    <b>
                        {data.mtClasses.totalCount +
                            data.mtMethods.totalCount +
                            data.mtUnions.totalCount}
                    </b>{' '}
                    for MTProto)
                </li>
                <li>
                    Current schema contains <b>{data.classes.totalCount}</b>{' '}
                    classes (+ <b>{data.mtClasses.totalCount}</b> for MTProto)
                </li>
                <li>
                    Current schema contains <b>{data.methods.totalCount}</b>{' '}
                    methods (+ <b>{data.mtMethods.totalCount}</b> for MTProto)
                </li>
                <li>
                    Current schema contains <b>{data.unions.totalCount}</b>{' '}
                    unions (+ <b>{data.mtUnions.totalCount}</b> for MTProto)
                </li>
                <li>
                    Description coverage:{' '}
                    {(function () {
                        const totalWith =
                            data.argWithDesc.totalCount +
                            data.clsWithDesc.totalCount
                        const totalWithout =
                            data.argWithoutDesc.totalCount +
                            data.clsWithoutDesc.totalCount
                        const total = totalWith + totalWithout

                        return (
                            <>
                                <b>
                                    {Math.round((totalWith / total) * 10000) /
                                        100}
                                    %
                                </b>{' '}
                                (out of {total} items, {totalWithout}{' '}
                                <MuiLink component={Link} to="/no-description">
                                    don't have description
                                </MuiLink>{' '}
                                - that is {data.clsWithoutDesc.totalCount} types
                                and {data.argWithoutDesc.totalCount} arguments)
                            </>
                        )
                    })()}
                </li>
            </Typography>
        </Page>
    )
}

export const query = graphql`
    query {
        mtClasses: allTlObject(
            filter: { type: { eq: "class" }, prefix: { eq: "mtproto/" } }
        ) {
            totalCount
        }
        classes: allTlObject(
            filter: { type: { eq: "class" }, prefix: { ne: "mtproto/" } }
        ) {
            totalCount
        }
        mtMethods: allTlObject(
            filter: { type: { eq: "method" }, prefix: { eq: "mtproto/" } }
        ) {
            totalCount
        }
        methods: allTlObject(
            filter: { type: { eq: "method" }, prefix: { ne: "mtproto/" } }
        ) {
            totalCount
        }
        mtUnions: allTlObject(
            filter: { type: { eq: "union" }, prefix: { eq: "mtproto/" } }
        ) {
            totalCount
        }
        unions: allTlObject(
            filter: { type: { eq: "union" }, prefix: { ne: "mtproto/" } }
        ) {
            totalCount
        }

        updated: allHistoryJson(
            sort: { fields: source___date, order: DESC }
            filter: { layer: { ne: null } }
            limit: 1
        ) {
            nodes {
                layer
                source {
                    date(formatString: "DD-MM-YYYY")
                    commit
                    file
                }
            }
        }

        clsWithDesc: allTlObject(filter: { description: { ne: null } }) {
            totalCount
        }
        clsWithoutDesc: allTlObject(filter: { description: { eq: null } }) {
            totalCount
        }
        argWithDesc: allTlObject(
            filter: { arguments: { elemMatch: { description: { ne: null } } } }
        ) {
            totalCount
            nodes {
                arguments {
                    description
                }
            }
        }
        argWithoutDesc: allTlObject(
            filter: { arguments: { elemMatch: { description: { eq: null } } } }
        ) {
            totalCount
            nodes {
                arguments {
                    description
                }
            }
        }
    }
`
