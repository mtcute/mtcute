import {
    Description,
    ListItemTlLink,
    ListItemTlObject,
    Page,
    Section,
    usePageStyles,
} from '../components/page'
import React from 'react'
import { graphql, Link } from 'gatsby'
import { ExtendedTlObject } from '../types'
import {
    Breadcrumbs,
    createStyles,
    Divider,
    Link as MuiLink,
    List,
    makeStyles,
    Typography,
} from '@material-ui/core'
import { LinkToTl } from '../components/objects/link-to-tl'
import { TableOfContentsItem } from '../components/table-of-contents'
import { ObjectParameters } from '../components/objects/object-parameters'
import { hexConstructorId } from '../utils'
import { Helmet } from 'react-helmet'

interface GraphqlResult {
    info: {
        uid: string
        type: string
        name: string
        history: {
            action: 'added' | 'modified' | 'removed'
            diff: string
            in: {
                date: string
                layer: number
                rev: number
                commit: string
                website: boolean
                file: string
            }
        }[]
    }
    object: ExtendedTlObject
}

const useStyles = makeStyles((theme) =>
    createStyles({
        description: {
            marginBottom: theme.spacing(2),
            fontSize: 16,
        },
        fakeStrikethrough: {
            textDecoration: 'line-through',
            '&:hover': {
                textDecoration: 'none',
            },
        },
    })
)

const capitalize = (s: string) => s[0].toUpperCase() + s.substr(1)

export default function TypeHistoryPage({
    data,
    pageContext,
}: {
    data: GraphqlResult
    pageContext: ExtendedTlObject // in fact not, but who cares
}) {
    const pageClasses = usePageStyles()
    const classes = useStyles()

    const obj = data.object ?? pageContext
    const history = data.info.history
    const first = history[history.length - 1]

    const toc: TableOfContentsItem[] = [{ id: 'title', title: obj.name }]

    history.forEach((item) =>
        toc.push({
            id: `layer${item.in.layer}${
                item.in.rev ? `-rev${item.in.rev}` : ''
            }`,
            title: `Layer ${item.in.layer}${
                item.in.rev ? ` rev. ${item.in.rev}` : ''
            }`,
        })
    )

    // documentation is not fetched for historical schemas (yet?)
    const fillDescriptionFromCurrent = (it: ExtendedTlObject): void => {
        if (!it.arguments || !obj.arguments) return

        it.arguments.forEach((arg) => {
            if (arg.description) return

            const curr = obj.arguments.find((i) => i.name === arg.name)
            if (curr) arg.description = curr.description
        })
    }

    const HistoryItem = (
        item: GraphqlResult['info']['history'][number]
    ): JSX.Element => {
        let content: JSX.Element | undefined = undefined

        if (pageContext.type === 'union') {
            if (item.action === 'added') {
                content = (
                    <>
                        <Typography variant="h5">Types</Typography>
                        <List>
                            {JSON.parse(item.diff).subtypes.map(
                                (type: string) => (
                                    <ListItemTlLink
                                        key={type}
                                        type="class"
                                        name={type}
                                        history
                                    />
                                )
                            )}
                        </List>
                    </>
                )
            } else if (item.action === 'modified') {
                let added = undefined
                let removed = undefined

                const diff = JSON.parse(item.diff).subtypes

                if (diff.added.length) {
                    added = (
                        <>
                            <Typography variant="h5">Added</Typography>
                            <List>
                                {diff.added.map((type: string) => (
                                    <ListItemTlLink
                                        key={type}
                                        type="class"
                                        name={type}
                                        history
                                    />
                                ))}
                            </List>
                        </>
                    )
                }

                if (diff.removed.length) {
                    removed = (
                        <>
                            <Typography variant="h5">Removed</Typography>
                            <List>
                                {diff.removed.map((type: string) => (
                                    <ListItemTlLink
                                        key={type}
                                        type="class"
                                        name={type}
                                        history
                                    />
                                ))}
                            </List>
                        </>
                    )
                }

                content = (
                    <>
                        {added}
                        {removed}
                    </>
                )
            }
        } else {
            if (item.action === 'added') {
                const object = JSON.parse(item.diff)
                fillDescriptionFromCurrent(object)

                content = (
                    <>
                        <Typography className={classes.description}>
                            Constructor ID: {hexConstructorId(object.id)}
                            <br />
                            {object.returns ? (
                                <>Returns: {LinkToTl(object.returns, true)}</>
                            ) : (
                                <>Belongs to: {LinkToTl(object.type, true)}</>
                            )}
                        </Typography>
                        <Typography variant="h5">Parameters</Typography>
                        <ObjectParameters obj={object} history />
                    </>
                )
            } else if (item.action === 'modified') {
                const stub: ExtendedTlObject = {
                    arguments: [],
                } as any

                const diff = JSON.parse(item.diff)

                if (diff.arguments) {
                    diff.arguments.added.forEach((arg: any) =>
                        stub.arguments.push({ ...arg, changed: 'added' })
                    )
                    diff.arguments.modified.forEach((arg: any) => {
                        stub.arguments.push({
                            ...arg.old,
                            changed: 'modified',
                            className: classes.fakeStrikethrough,
                        })
                        stub.arguments.push({ ...arg.new, changed: 'modified' })
                    })
                    diff.arguments.removed.forEach((arg: any) =>
                        stub.arguments.push({ ...arg, changed: 'removed' })
                    )
                }
                fillDescriptionFromCurrent(stub)

                let constructorId = undefined
                let returns = undefined
                let union = undefined

                if (diff.id) {
                    constructorId = (
                        <Typography>
                            Constructor ID:{' '}
                            <span className={classes.fakeStrikethrough}>
                                {hexConstructorId(diff.id.old)}
                            </span>{' '}
                            → {hexConstructorId(diff.id.new)}
                        </Typography>
                    )
                }

                if (diff.returns) {
                    returns = (
                        <Typography>
                            Returns:{' '}
                            <span className={classes.fakeStrikethrough}>
                                {LinkToTl(diff.returns.old, true)}
                            </span>{' '}
                            → {LinkToTl(diff.returns.new, true)}
                        </Typography>
                    )
                }

                if (diff.type) {
                    union = (
                        <Typography>
                            Belongs to:{' '}
                            <span className={classes.fakeStrikethrough}>
                                {LinkToTl(diff.type.old, true)}
                            </span>{' '}
                            → {LinkToTl(diff.type.new, true)}
                        </Typography>
                    )
                }

                content = (
                    <>
                        <Typography className={classes.description}>
                            {constructorId}
                            {returns}
                            {union}
                        </Typography>
                        <Typography variant="h5">Parameters</Typography>
                        {diff.arguments && (
                            <ObjectParameters obj={stub} diff history />
                        )}
                    </>
                )
            }
        }

        return (
            <>
                <div className={pageClasses.heading0}>
                    <Typography
                        variant="h4"
                        id={`layer${item.in.layer}${
                            item.in.rev ? `-rev${item.in.rev}` : ''
                        }`}
                    >
                        {capitalize(item.action)} in Layer {item.in.layer}
                        {item.in.rev > 0 && (
                            <span className={pageClasses.rev}>
                                {' '}
                                rev. {item.in.rev}
                            </span>
                        )}
                    </Typography>
                    <Typography variant="body2">
                        on {item.in.website ? 'website' : item.in.date}
                        {!item.in.website && (
                            <>
                                {' '}
                                / commit{' '}
                                <MuiLink
                                    href={`https://github.com/telegramdesktop/tdesktop/commit/${item.in.commit}`}
                                    target="_blank"
                                >
                                    {item.in.commit.substr(0, 7)}
                                </MuiLink>{' '}
                                (
                                <MuiLink
                                    href={`https://github.com/telegramdesktop/tdesktop/blob/${item.in.commit}/${item.in.file}`}
                                    target="_blank"
                                >
                                    file
                                </MuiLink>
                                )
                            </>
                        )}
                    </Typography>
                </div>
                {content}
            </>
        )
    }

    return (
        <Page toc={toc}>
            <Helmet>
                <title>History of {obj.name}</title>
                <meta
                    name="description"
                    content={
                        `${obj.name}, first introduced in layer ${first.in.layer}` +
                        `, has had ${history.length - 1} changes over time`
                    }
                />
            </Helmet>

            <div className={pageClasses.heading0}>
                <Breadcrumbs>
                    <MuiLink component={Link} to={`/history`}>
                        History
                    </MuiLink>
                    <Typography color="textPrimary">Types</Typography>
                    <Typography color="textPrimary">{obj.name}</Typography>
                </Breadcrumbs>
                <Typography variant="h3" id="title">
                    {obj.name}
                </Typography>
                <Typography variant="body2">
                    first introduced in layer {first.in.layer} on{' '}
                    {first.in.website ? 'website' : first.in.date}
                    {data.object && (
                        <>
                            {' '}
                            /{' '}
                            <MuiLink
                                component={Link}
                                to={`/${obj.type}/${obj.name}`}
                            >
                                current
                            </MuiLink>
                        </>
                    )}
                </Typography>
            </div>
            <Description
                description={obj.description}
                className={classes.description}
            />
            {history.map(HistoryItem)}
        </Page>
    )
}

export const query = graphql`
    query($uid: String!, $name: String!, $type: String!) {
        info: typesJson(uid: { eq: $uid }) {
            uid
            type
            name
            history {
                action
                diff
                in {
                    date(formatString: "DD-MM-YYYY")
                    layer
                    rev
                    commit
                    file
                    website
                }
            }
        }

        object: tlObject(
            prefix: { eq: "" }
            name: { eq: $name }
            type: { eq: $type }
        ) {
            prefix
            type
            name
            description
            arguments {
                name
                description
            }
        }
    }
`
