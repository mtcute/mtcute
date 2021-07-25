import { TableOfContents, TableOfContentsItem } from './table-of-contents'
import React, { useState } from 'react'
import {
    Box,
    Container,
    createStyles,
    Divider,
    Link as MuiLink,
    List,
    makeStyles,
    Paper,
    Typography,
} from '@material-ui/core'
import { ExtendedTlObject } from '../types'
import { Link } from 'gatsby'

const useStyles = makeStyles(() =>
    createStyles({
        container: {
            height: '100%',
            padding: 16,
            display: 'flex',
            flexDirection: 'row',
            overflowY: 'auto',
        },
        inner: {
            flex: '1 1 auto',
        },
        box: {
            paddingBottom: 32,
        },
        footer: {
            marginTop: 64,
            textAlign: 'center',
        },
    })
)

export const usePageStyles = makeStyles((theme) =>
    createStyles({
        heading0: {
            margin: theme.spacing(4, 0),
        },
        heading1: {
            marginBottom: theme.spacing(4),
        },
        heading: {
            marginTop: theme.spacing(6),
            marginBottom: theme.spacing(4),
        },
        paragraph: {
            marginBottom: theme.spacing(2),
        },
        rev: {
            fontSize: 16,
            fontWeight: 500,
            marginLeft: 2,
        },
    })
)

export function Page({
    toc,
    children,
}: {
    toc?: TableOfContentsItem[]
    children: React.ReactNode
}): React.ReactElement {
    const classes = useStyles()
    const [container, setContainer] = useState<HTMLElement | null>(null)

    return (
        <Paper ref={setContainer} elevation={0} className={classes.container}>
            <Container maxWidth="md" className={classes.inner}>
                <Box className={classes.box}>
                    {children}

                    <footer>
                        <Typography
                            color="textSecondary"
                            variant="body2"
                            className={classes.footer}
                        >
                            &copy; mtqt TL reference. This website is{' '}
                            <MuiLink href="https://github.com/mtqt-dev/mtqt/tree/master/tl-reference">
                                open-source
                            </MuiLink>{' '}
                            and licensed under MIT.
                            <br />
                            This website is not affiliated with Telegram.
                        </Typography>
                    </footer>
                </Box>
            </Container>
            {toc && <TableOfContents items={toc} container={container} />}
        </Paper>
    )
}

export function Description(params: {
    description?: string | null
    component?: any
    className?: string
}) {
    const { description, component: Component, ...other } = params as any

    return Component ? (
        <Component
            {...other}
            dangerouslySetInnerHTML={{
                __html: description || 'No description available :(',
            }}
        />
    ) : (
        <div
            {...other}
            dangerouslySetInnerHTML={{
                __html: description || 'No description available :(',
            }}
        />
    )
}

export function ListItemTlObject({ node }: { node: ExtendedTlObject }) {
    return (
        <>
            <div style={{ padding: '16px 32px' }}>
                <MuiLink
                    component={Link}
                    to={`/${node.prefix}${node.type}/${node.name}`}
                >
                    <Typography variant="h5" color="textPrimary">
                        {node.prefix}
                        {node.name}
                    </Typography>
                </MuiLink>
                <Description description={node.description} />
            </div>
            <Divider />
        </>
    )
}

export function ListItemTlLink({
    name,
    type,
    history,
}: {
    type: string
    name: string
    history?: boolean
}) {
    return (
        <>
            <div style={{ padding: '16px 32px' }}>
                <MuiLink
                    component={Link}
                    to={`/${history ? 'history/' : ''}${type}/${name}`}
                >
                    <Typography variant="h5" color="textPrimary">
                        {name}
                    </Typography>
                </MuiLink>
                <Description />
            </div>
            <Divider />
        </>
    )
}

export function Section({
    title,
    id,
    children,
}: {
    title?: string
    id?: string
    children: React.ReactNode
}) {
    const pageClasses = usePageStyles()

    return (
        <>
            {title && id && (
                <Typography
                    variant="h4"
                    id={id}
                    className={pageClasses.heading}
                >
                    {title}
                </Typography>
            )}
            {children}
        </>
    )
}

export function SectionWithList({
    nodes,
    children,
    ...params
}: Omit<Parameters<typeof Section>[0], 'children'> & {
    children?: React.ReactNode
    nodes: ExtendedTlObject[]
}) {
    return (
        <Section {...params}>
            {children && <Typography variant="body1">{children}</Typography>}
            <List>
                {nodes.map((node) => (
                    <ListItemTlObject node={node} key={node.id} />
                ))}
            </List>
        </Section>
    )
}
