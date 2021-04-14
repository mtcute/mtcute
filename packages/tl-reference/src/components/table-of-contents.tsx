import { createStyles, Link, makeStyles, Typography } from '@material-ui/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import throttle from 'lodash/throttle'
import React, { MouseEvent } from 'react'
import clsx from 'clsx'

// based on https://github.com/mui-org/material-ui/blob/master/docs/src/modules/components/AppTableOfContents.js

const useStyles = makeStyles((theme) =>
    createStyles({
        root: {
            top: 80,
            // Fix IE 11 position sticky issue.
            width: 175,
            flexShrink: 0,
            order: 2,
            position: 'sticky',
            height: 'calc(100vh - 80px)',
            overflowY: 'auto',
            padding: theme.spacing(2, 2, 2, 0),
            display: 'none',
            [theme.breakpoints.up('sm')]: {
                display: 'block',
            },
        },
        contents: {
            marginTop: theme.spacing(2),
            paddingLeft: theme.spacing(1.5),
        },
        ul: {
            padding: 0,
            margin: 0,
            listStyleType: 'none',
        },
        item: {
            fontSize: 13,
            padding: theme.spacing(0.5, 0, 0.5, 1),
            borderLeft: '4px solid transparent',
            boxSizing: 'content-box',
            '&:hover': {
                borderLeft: `4px solid ${
                    theme.palette.type === 'light'
                        ? theme.palette.grey[200]
                        : theme.palette.grey[900]
                }`,
            },
            '&$active,&:active': {
                borderLeft: `4px solid ${
                    theme.palette.type === 'light'
                        ? theme.palette.grey[300]
                        : theme.palette.grey[800]
                }`,
            },
        },
        secondaryItem: {
            paddingLeft: theme.spacing(2.5),
        },
        active: {},
    })
)
const noop = () => {}

function useThrottledOnScroll(
    callback: ((evt: Event) => void) | null,
    delay: number,
    container: HTMLElement | null
) {
    const throttledCallback = useMemo(
        () => (callback ? throttle(callback, delay) : noop),
        [callback, delay]
    )

    useEffect(() => {
        if (throttledCallback === noop || container === null) {
            return undefined
        }

        container.addEventListener('scroll', throttledCallback)
        return () => {
            container.removeEventListener('scroll', throttledCallback)
        }
    }, [throttledCallback, container])
}

export interface TableOfContentsItem {
    id: string
    title: string
}

interface TocWithNode extends TableOfContentsItem {
    node: HTMLElement
}

export function TableOfContents({
    items,
    container,
}: {
    items: TableOfContentsItem[]
    container: HTMLElement | null
}): React.ReactElement {
    const classes = useStyles()

    const itemsWithNodeRef = useRef<TocWithNode[]>([])
    useEffect(() => {
        itemsWithNodeRef.current = items
            ? items.map(({ id, title }) => {
                  return {
                      id,
                      title,
                      node: document.getElementById(id)!,
                  }
              })
            : []
    }, [items])

    const [activeState, setActiveState] = useState<string | null>(items[0]?.id || null)
    const clickedRef = useRef(false)
    const unsetClickedRef = useRef<NodeJS.Timeout | null>(null)
    const findActiveIndex = useCallback(() => {
        // Don't set the active index based on scroll if a link was just clicked
        if (clickedRef.current || !container) {
            return
        }

        let active
        for (let i = itemsWithNodeRef.current.length - 1; i >= 0; i -= 1) {
            const item = itemsWithNodeRef.current[i]

            if (process.env.NODE_ENV !== 'production') {
                if (!item.node) {
                    console.error(
                        `Missing node on the item ${JSON.stringify(
                            item,
                            null,
                            2
                        )}`
                    )
                }
            }

            if (
                item.node &&
                item.node.offsetTop <
                    container.scrollTop + container.clientHeight / 8
            ) {
                active = item
                break
            }
        }

        if (active && activeState !== active.id) {
            setActiveState(active.id!)
        }
    }, [activeState, container])

    // Corresponds to 10 frames at 60 Hz
    useThrottledOnScroll(
        items && items.length > 0 ? findActiveIndex : null,
        166,
        container
    )

    const handleClick = (id: string) => (
        event: MouseEvent<HTMLAnchorElement>
    ) => {
        // Ignore click for new tab/new window behavior
        if (
            event.defaultPrevented ||
            event.button !== 0 || // ignore everything but left-click
            event.metaKey ||
            event.ctrlKey ||
            event.altKey ||
            event.shiftKey
        ) {
            return
        }

        // Used to disable findActiveIndex if the page scrolls due to a click
        clickedRef.current = true
        unsetClickedRef.current = setTimeout(() => {
            clickedRef.current = false
        }, 1000)

        if (activeState !== id) {
            setActiveState(id)
        }
    }

    useEffect(
        () => {
            findActiveIndex()

            return () => {
                if (unsetClickedRef.current) {
                    clearTimeout(unsetClickedRef.current)
                }
            }
        },
        []
    )

    const itemLink = (item: TableOfContentsItem): React.ReactElement => (
        <Link
            display="block"
            color={activeState === item.id ? 'textPrimary' : 'textSecondary'}
            href={`#${item.id}`}
            underline="none"
            onClick={handleClick(item.id)}
            className={clsx(
                classes.item,
                activeState === item.id ? classes.active : undefined
            )}
        >
            <span dangerouslySetInnerHTML={{ __html: item.title }} />
        </Link>
    )

    return (
        <nav className={classes.root}>
            {items && items.length > 0 ? (
                <>
                    <Typography gutterBottom className={classes.contents}>
                        Contents
                    </Typography>
                    <Typography component="ul" className={classes.ul}>
                        {items.map((item) => (
                            <li key={item.id}>{itemLink(item)}</li>
                        ))}
                    </Typography>
                </>
            ) : null}
        </nav>
    )
}
