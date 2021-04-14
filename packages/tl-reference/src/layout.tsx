import React, { useEffect, useState } from 'react'
import {
    AppBar,
    Button,
    createMuiTheme, createStyles,
    IconButton,
    List,
    ListItem,
    ListItemText, makeStyles,
    MuiThemeProvider,
    SwipeableDrawer,
    Toolbar,
    Tooltip,
    useMediaQuery,
} from '@material-ui/core'
import { Link } from 'gatsby'
import { Spacer } from './components/spacer'
import { Helmet } from 'react-helmet'

import NightsStayIcon from '@material-ui/icons/NightsStay'
import Brightness7Icon from '@material-ui/icons/Brightness7'
import MenuIcon from '@material-ui/icons/Menu'

import './global.scss'
import { GlobalSearchField } from './components/global-search-field'
import blue from '@material-ui/core/colors/blue'
import { isTouchDevice } from './utils'

const pages = [
    {
        path: '/',
        name: 'About',
        regex: /^(?:\/tl|\/)\/?$/
    },
    {
        path: '/types',
        name: 'Types',
        regex: /^(?:\/tl)?(?:\/mtproto)?\/(class|union|types)(\/|$)/,
    },
    {
        path: '/methods',
        name: 'Methods',
        regex: /^(?:\/tl)?(?:\/mtproto)?\/methods?(\/|$)/,
    },
    // {
    //     path: '/history',
    //     name: 'History',
    //     regex: /^\/history(\/|$)/,
    // },
]

const drawerWidth = 240
const useStyles = makeStyles((t) => createStyles({
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    drawerItem: {
        padding: t.spacing(2, 4),
        fontSize: 18
    }
}))

function MobileNavigation({ path }: { path: string }) {
    const [drawer, setDrawer] = useState(false)

    const classes = useStyles()

    return (
        <>
            <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={() => setDrawer(true)}
                edge="start"
            >
                <MenuIcon />
            </IconButton>
            <SwipeableDrawer
                onClose={() => setDrawer(false)}
                onOpen={() => setDrawer(true)}
                open={drawer}
                className={classes.drawer}
                classes={{
                    paper: classes.drawerPaper,
                }}
            >
                <List>
                    {pages.map((page) => (
                        <ListItem
                            button
                            component={Link}
                            to={page.path}
                            selected={
                                page.regex
                                    ? !!path.match(page.regex)
                                    : path === page.path
                            }
                            className={classes.drawerItem}
                            key={page.name}
                        >
                            <ListItemText primary={page.name} />
                        </ListItem>
                    ))}
                </List>
            </SwipeableDrawer>
        </>
    )
}

function DesktopNavigation({ path }: { path: string }) {
    return (
        <>
            {pages.map((page) => (
                <span
                    style={{
                        color: (
                            page.regex
                                ? path.match(page.regex)
                                : path === page.path
                        )
                            ? '#fff'
                            : '#ccc',
                    }}
                    key={page.path}
                >
                    <Button color="inherit" component={Link} to={page.path}>
                        {page.name}
                    </Button>
                </span>
            ))}
            <Spacer />
        </>
    )
}

export default function ({
    children,
    location,
}: {
    children: NonNullable<React.ReactNode>
    location: any
}): React.ReactElement {
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const path: string = location.pathname

    useEffect(() => {
        if (isTouchDevice()) document.documentElement.classList.add('touch')
    }, [])

    const muiTheme = createMuiTheme({
        palette: {
            type: theme,
            primary:
                theme === 'dark'
                    ? {
                          main: blue[300],
                      }
                    : undefined,
            secondary: {
                main: blue[800],
            },
        },
    })

    const isDesktop = useMediaQuery(muiTheme.breakpoints.up('sm'))

    return (
        <>
            <Helmet
                titleTemplate="%s | TL Reference"
                defaultTitle="TL Reference"
            />
            <MuiThemeProvider theme={muiTheme}>
                <>
                    <AppBar position="static" color="secondary">
                        <Toolbar>
                            {isDesktop ? (
                                <DesktopNavigation path={path} />
                            ) : (
                                <MobileNavigation path={path} />
                            )}
                            <GlobalSearchField isMobile={!isDesktop} />
                            <Tooltip title="Toggle dark theme">
                                <IconButton
                                    color="inherit"
                                    onClick={() =>
                                        setTheme(
                                            theme === 'dark' ? 'light' : 'dark'
                                        )
                                    }
                                >
                                    {theme === 'light' ? (
                                        <NightsStayIcon />
                                    ) : (
                                        <Brightness7Icon />
                                    )}
                                </IconButton>
                            </Tooltip>
                        </Toolbar>
                    </AppBar>
                    {children}
                </>
            </MuiThemeProvider>
        </>
    )
}
