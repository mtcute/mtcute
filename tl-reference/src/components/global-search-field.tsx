import { graphql, Link, useStaticQuery } from 'gatsby'
import { ChangeEvent, useState } from 'react'
import { ExtendedTlObject, GraphqlAllResponse } from '../types'
import SearchIcon from '@material-ui/icons/Search'
import {
    Avatar,
    createStyles,
    Fade,
    fade,
    InputBase,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    makeStyles,
    Paper,
    Popper,
    Theme,
    Button,
    ClickAwayListener,
} from '@material-ui/core'
import React from 'react'
import { useLocalState } from '../hooks/use-local-state'
import Fuse from 'fuse.js'

import blue from '@material-ui/core/colors/blue'
import red from '@material-ui/core/colors/red'
import yellow from '@material-ui/core/colors/yellow'

import UnionIcon from '@material-ui/icons/AccountTree'
import ClassIcon from '@material-ui/icons/Class'
import FunctionsIcon from '@material-ui/icons/Functions'
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline'
import { useFuse } from '../hooks/use-fuse'
import { FuseHighlight } from './fuse-highlight'
import { ActionBarSearchField } from './actionbar-search-field'

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        popup: {
            display: 'flex',
            height: 250,
            overflowY: 'auto',
            overflowX: 'hidden',
        },
        popupEmpty: {
            padding: theme.spacing(2),
            flex: '1 1 auto',
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column',
        },
        popupEmptyIcon: {
            fontSize: '48px',
            display: 'block',
            marginBottom: theme.spacing(2),
        },
        popupList: {
            width: '100%',
        },
        popupListItem: {
            padding: theme.spacing(0, 2),
        },
        searchItemMatch: {
            color: theme.palette.type === 'dark' ? blue[300] : blue[700],
        },
    })
)

export function GlobalSearchField({ isMobile }: { isMobile: boolean }): React.ReactElement {
    const classes = useStyles()
    const allObjects: {
        allTlObject: GraphqlAllResponse<ExtendedTlObject>
    } = useStaticQuery(graphql`
        query {
            allTlObject {
                edges {
                    node {
                        id
                        prefix
                        type
                        name
                    }
                }
            }
        }
    `)

    const [includeMtproto, setIncludeMtproto] = useLocalState('mtproto', false)
    const { hits, query, onSearch } = useFuse(
        allObjects.allTlObject.edges,
        {
            keys: ['node.name'],
            includeMatches: true,
            threshold: 0.3,
        },
        { limit: 25 },
        includeMtproto ? undefined : (it) => it.node.prefix !== 'mtproto/'
    )

    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const [open, setOpen] = useState(false)

    const notFound = () => (
        <>
            <ErrorOutlineIcon className={classes.popupEmptyIcon} />
            Nothing found
            {!includeMtproto && (
                <Button
                    variant="text"
                    size="small"
                    style={{
                        margin: '4px auto',
                    }}
                    onClick={() => {
                        setIncludeMtproto(true)
                    }}
                >
                    Retry including MTProto objects
                </Button>
            )}
        </>
    )

    const emptyField = () => (
        <>
            <SearchIcon className={classes.popupEmptyIcon} />
            Start typing...
        </>
    )

    const renderSearchItem = (
        node: ExtendedTlObject,
        matches: ReadonlyArray<Fuse.FuseResultMatch>
    ) => (
        <ListItem
            button
            divider
            component={Link}
            to={`/${node.prefix}${node.type}/${node.name}`}
            className={classes.popupListItem}
            onClick={() => setOpen(false)}
            key={node.id}
        >
            <ListItemAvatar>
                <Avatar
                    style={{
                        backgroundColor:
                            node.type === 'class'
                                ? blue[600]
                                : node.type === 'method'
                                ? red[600]
                                : yellow[700],
                    }}
                >
                    {node.type === 'class' ? (
                        <ClassIcon />
                    ) : node.type === 'method' ? (
                        <FunctionsIcon />
                    ) : (
                        <UnionIcon />
                    )}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={
                    <>
                        {node.prefix}
                        <FuseHighlight
                            matches={matches}
                            value={node.name}
                            className={classes.searchItemMatch}
                        />
                    </>
                }
                secondary={node.type}
            />
        </ListItem>
    )

    const popupContent = (
        <Paper className={classes.popup}>
            {query.length <= 1 || !hits.length ? (
                <div className={classes.popupEmpty}>
                    {query.length <= 1 ? emptyField() : notFound()}
                </div>
            ) : (
                <List disablePadding dense className={classes.popupList}>
                    {hits.map(({ item: { node }, matches }) =>
                        renderSearchItem(node, matches!)
                    )}
                    <div style={{ textAlign: 'center' }}>
                        <Button
                            variant="text"
                            size="small"
                            style={{
                                margin: '4px auto',
                            }}
                            onClick={() => {
                                setIncludeMtproto(!includeMtproto)
                            }}
                        >
                            {includeMtproto ? 'Hide' : 'Include'} MTProto
                            objects
                        </Button>
                    </div>
                </List>
            )}
        </Paper>
    )

    return (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
            <>
                <ActionBarSearchField
                    inputRef={setAnchorEl}
                    autoComplete="off"
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    onChange={onSearch}
                />
                <Popper
                    open={open}
                    anchorEl={anchorEl}
                    placement="bottom"
                    transition
                    style={{
                        width: isMobile ? '100%' : anchorEl?.clientWidth,
                        zIndex: 9999,
                    }}
                >
                    {({ TransitionProps }) => (
                        <Fade {...TransitionProps} timeout={350}>
                            {popupContent}
                        </Fade>
                    )}
                </Popper>
            </>
        </ClickAwayListener>
    )
}
