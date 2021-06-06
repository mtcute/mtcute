import { graphql, Link } from 'gatsby'
import React, { useMemo } from 'react'
import { ExtendedTlObject } from '../types'
import {
    Page,
    Section,
    SectionWithList,
    usePageStyles,
} from '../components/page'
import {
    Breadcrumbs,
    createStyles,
    Link as MuiLink,
    makeStyles,
    Typography,
} from '@material-ui/core'
import { TableOfContentsItem } from '../components/table-of-contents'
import { Helmet } from 'react-helmet'

interface Data {
    classes: { nodes: ExtendedTlObject[] }
    unions: { nodes: ExtendedTlObject[] }
    methods: { nodes: ExtendedTlObject[] }
    other: { group: { fieldValue: string }[] }
}

interface Context {
    ns: string
    prefix: string
    type: string
}

const useStyles = makeStyles((theme) =>
    createStyles({
        namespace: {
            display: 'inline-block',
            margin: theme.spacing(0, 1),
            fontSize: 16,
        },
    })
)

function useToc(data: Data, ctx: Context): TableOfContentsItem[] {
    return useMemo(() => {
        const ret = [{ id: 'namespaces', title: 'Namespaces' }]

        if (ctx.type === 'types') {
            ret.push({ id: 'classes', title: 'Classes' })
            ret.push({ id: 'unions', title: 'Unions' })
        } else {
            ret.push({ id: 'methods', title: 'Methods' })
        }

        return ret
    }, [data, ctx])
}

export default function TlTypesList({
    data,
    pageContext: ctx,
}: {
    data: Data
    pageContext: Context
}) {
    const pageClasses = usePageStyles()
    const classes = useStyles()

    const toc = useToc(data, ctx)

    const title = `${ctx.type === 'methods' ? 'Methods' : 'Types'}
                    ${
                        ctx.ns === '$root' && ctx.prefix === ''
                            ? ''
                            : ctx.ns === '$root'
                            ? `in ${ctx.prefix.slice(0, ctx.prefix.length - 1)}`
                            : ` in ${ctx.prefix}${ctx.ns}`
                    }`

    const plural = (val: number, singular: string, postfix = 's') =>
        val + ' ' + (val === 1 ? singular : singular + postfix)

    let description = ''
    {
        if (ctx.prefix === 'mtproto/') description = 'MTProto '
        if (ctx.ns === '$root') {
            description += 'TL Schema'
        } else {
            description += 'Namespace ' + ctx.ns
        }
        description += ' contains '
        if (ctx.ns === '$root' && data.other.group.length) {
            description += plural(data.other.group.length, 'namespace') + ', '
        }

        if (ctx.type === 'methods') {
            description +=
                plural(data.methods.nodes.length, 'method') +
                ', including: ' +
                data.methods.nodes
                    .slice(0, 3)
                    .map((i) => i.name)
                    .join(', ')

            if (data.methods.nodes.length > 3) description += ' and others.'
        } else {
            description +=
                plural(data.classes.nodes.length, 'class', 'es') +
                ' and ' +
                plural(data.unions.nodes.length, 'union') +
                ', including: ' +
                data.classes.nodes
                    .slice(0, 3)
                    .map((i) => i.name)
                    .join(', ')

            if (data.classes.nodes.length > 3) description += ' and others.'
        }
    }

    return (
        <Page toc={toc}>
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
            </Helmet>

            <div className={pageClasses.heading0}>
                <Breadcrumbs>
                    {ctx.ns === '$root' ? (
                        <Typography color="textPrimary">
                            {ctx.prefix}{ctx.type === 'methods' ? 'Methods' : 'Types'}
                        </Typography>
                    ) : (
                        [
                            <MuiLink
                                component={Link}
                                to={`/${ctx.prefix}${ctx.type}`}
                                key="type"
                            >
                                {ctx.prefix}{ctx.type === 'methods' ? 'Methods' : 'Types'}
                            </MuiLink>,
                            <Typography color="textPrimary" key="namespace">
                                {ctx.ns}
                            </Typography>,
                        ]
                    )}
                </Breadcrumbs>
                <Typography variant="h3" id="title">
                    {title}
                </Typography>
                <Typography variant="body2">
                    {ctx.ns === '$root' &&
                        `has ${plural(
                            data.other.group.length,
                            'namespace'
                        )} / `}
                    {ctx.type === 'methods'
                        ? `has ${plural(data.methods.nodes.length, 'method')}`
                        : `has ${plural(
                              data.classes.nodes.length,
                              'class',
                              'es'
                          )}` +
                          ` and ${plural(data.unions.nodes.length, 'union')}`}
                </Typography>
            </div>
            {data.other.group.length && (
                <Section id="namespaces" title="Namespaces">
                    {data.other.group.map(({ fieldValue: it }) =>
                        it === ctx.ns ? (
                            <Typography
                                color="textPrimary"
                                className={classes.namespace}
                                key={it}
                            >
                                {ctx.ns === '$root' ? 'root' : ctx.ns}
                            </Typography>
                        ) : (
                            <MuiLink
                                component={Link}
                                to={`/${ctx.prefix}${ctx.type}${
                                    it === '$root' ? '' : '/' + it
                                }`}
                                className={classes.namespace}
                                key={it}
                            >
                                {it === '$root' ? 'root' : it}
                            </MuiLink>
                        )
                    )}
                </Section>
            )}
            {ctx.type === 'types' && (
                <>
                    <SectionWithList
                        id="classes"
                        title="Classes"
                        nodes={data.classes.nodes}
                    />
                    <SectionWithList
                        id="unions"
                        title="Unions"
                        nodes={data.unions.nodes}
                    />
                </>
            )}
            {ctx.type === 'methods' && (
                <SectionWithList
                    id="methods"
                    title="Methods"
                    nodes={data.methods.nodes}
                />
            )}
        </Page>
    )
}

export const query = graphql`
    query(
        $ns: String!
        $prefix: String!
        $isTypes: Boolean!
        $isMethods: Boolean!
    ) {
        classes: allTlObject(
            filter: {
                prefix: { eq: $prefix }
                namespace: { eq: $ns }
                type: { eq: "class" }
            }
        ) @include(if: $isTypes) {
            nodes {
                id
                prefix
                type
                name
                description
            }
        }

        unions: allTlObject(
            filter: {
                prefix: { eq: $prefix }
                namespace: { eq: $ns }
                type: { eq: "union" }
            }
        ) @include(if: $isTypes) {
            nodes {
                id
                prefix
                type
                name
                description
            }
        }

        methods: allTlObject(
            filter: {
                prefix: { eq: $prefix }
                namespace: { eq: $ns }
                type: { eq: "method" }
            }
        ) @include(if: $isMethods) {
            nodes {
                id
                prefix
                type
                name
                description
            }
        }

        other: allTlObject(filter: { prefix: { eq: $prefix } }) {
            group(field: namespace) {
                fieldValue
            }
        }
    }
`
