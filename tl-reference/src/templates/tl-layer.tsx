import React, { ReactNode, useState } from 'react'
import { graphql, Link } from 'gatsby'
import { Page, usePageStyles } from '../components/page'
import {
    Breadcrumbs,
    Button,
    createStyles,
    Link as MuiLink,
    makeStyles,
    Snackbar,
    Typography,
} from '@material-ui/core'
import { Spacer } from '../components/spacer'
import { TlSchemaCode } from '../components/tl-schema-code'
import { Helmet } from 'react-helmet'

import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import CodeIcon from '@material-ui/icons/Code'
import CloudDownloadIcon from '@material-ui/icons/CloudDownload'

interface GraphqlResult {
    layer: {
        layer: number
        rev: number
        content: string
        source: {
            date: string
            commit: string
            website: boolean
            file: string
        }
    }

    prev: {
        layer: number
        rev: number
    }

    next: {
        layer: number
        rev: number
    }
}

const useStyles = makeStyles((theme) =>
    createStyles({
        navigation: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: '100%',
        },
        btn: {
            margin: theme.spacing(1),
        },
    })
)

export default function TlLayer({
    data: { layer, prev, next },
}: {
    data: GraphqlResult
}) {
    const pageClasses = usePageStyles()
    const classes = useStyles()

    const [snackText, setSnackText] = useState<string | undefined>(undefined)

    function copyToClipboard() {
        // https://stackoverflow.com/a/30810322
        const area = document.createElement('textarea')
        area.style.position = 'fixed'
        area.style.top = '0'
        area.style.left = '0'
        area.style.width = '2em'
        area.style.height = '2em'
        area.style.padding = '0'
        area.style.border = 'none'
        area.style.outline = 'none'
        area.style.boxShadow = 'none'
        area.style.background = 'transparent'

        area.value = layer.content

        document.body.appendChild(area)
        area.focus()
        area.select()

        document.execCommand('copy')
        document.body.removeChild(area)

        setSnackText('Copied to clipboard!')
    }

    function downloadAsFile() {
        const link = document.createElement('a')
        link.setAttribute(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent(layer.content)
        )
        link.setAttribute(
            'download',
            `layer${layer.layer}${layer.rev ? `-rev${layer.rev}` : ''}.tl`
        )

        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Page>
            <Helmet>
                <title>
                    {`Layer ${layer.layer}` +
                        `${layer.rev > 0 ? ` rev. ${layer.rev}` : ''}`}
                </title>
                <meta
                    name="description"
                    content={
                        `TL code representing layer ${layer.layer}` +
                        `${layer.rev > 0 && ` rev. ${layer.rev}`}` +
                        ` (from ${
                            layer.source.website ? 'website' : layer.source.date
                        })`
                    }
                />
            </Helmet>

            <div className={classes.navigation}>
                {prev && (
                    <Button
                        component={Link}
                        variant="outlined"
                        color="primary"
                        to={`/history/layer${prev.layer}${
                            prev.rev ? `-rev${prev.rev}` : ''
                        }`}
                        startIcon={<ChevronLeftIcon />}
                    >
                        Layer {prev.layer}
                        {prev.rev > 0 && ` rev. ${prev.rev}`}
                    </Button>
                )}
                <Spacer />
                {next && (
                    <Button
                        component={Link}
                        variant="outlined"
                        color="primary"
                        to={`/history/layer${next.layer}${
                            next.rev ? `-rev${next.rev}` : ''
                        }`}
                        endIcon={<ChevronRightIcon />}
                    >
                        Layer {next.layer}
                        {next.rev > 0 && ` rev. ${next.rev}`}
                    </Button>
                )}
            </div>

            <div className={pageClasses.heading0}>
                <Breadcrumbs>
                    <MuiLink component={Link} to={`/history`}>
                        History
                    </MuiLink>
                    <Typography color="textPrimary">
                        Layer {layer.layer}
                        {layer.rev > 0 && ` rev. ${layer.rev}`}
                    </Typography>
                </Breadcrumbs>
                <Typography variant="h3" id="title">
                    Layer {layer.layer}
                    {layer.rev > 0 && (
                        <span className={pageClasses.rev}>
                            {' '}
                            rev. {layer.rev}
                        </span>
                    )}
                </Typography>
                <Typography variant="body2">
                    from {layer.source.website ? 'website' : layer.source.date}
                    {!layer.source.website && (
                        <>
                            {' '}
                            / commit{' '}
                            <MuiLink
                                href={`https://github.com/telegramdesktop/tdesktop/commit/${layer.source.commit}`}
                                target="_blank"
                            >
                                {layer.source.commit.substr(0, 7)}
                            </MuiLink>{' '}
                            (
                            <MuiLink
                                href={`https://github.com/telegramdesktop/tdesktop/blob/${layer.source.commit}/${layer.source.file}`}
                                target="_blank"
                            >
                                file
                            </MuiLink>
                            )
                        </>
                    )}
                </Typography>
            </div>

            <Snackbar
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={snackText !== undefined}
                autoHideDuration={5000}
                onClose={() => setSnackText(undefined)}
                message={snackText}
            />
            <div
                className={classes.navigation}
                style={{ justifyContent: 'flex-end' }}
            >
                <Button
                    className={classes.btn}
                    variant="outlined"
                    color="primary"
                    startIcon={<CodeIcon />}
                    onClick={copyToClipboard}
                >
                    Copy to clipboard
                </Button>
                <Button
                    className={classes.btn}
                    variant="outlined"
                    color="primary"
                    startIcon={<CloudDownloadIcon />}
                    onClick={downloadAsFile}
                >
                    Download
                </Button>
            </div>

            <TlSchemaCode tl={layer.content} />
        </Page>
    )
}

export const query = graphql`
    query($layer: Int!, $rev: Int!, $prev: String, $next: String) {
        layer: historyJson(layer: { eq: $layer }, rev: { eq: $rev }) {
            layer
            rev
            content
            prev
            next
            source {
                website
                date(formatString: "DD-MM-YYYY")
                commit
                file
            }
        }

        prev: historyJson(uid: { eq: $prev }) {
            layer
            rev
        }

        next: historyJson(uid: { eq: $next }) {
            layer
            rev
        }
    }
`
