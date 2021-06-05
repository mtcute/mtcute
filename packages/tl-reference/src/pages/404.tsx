import * as React from 'react'
import { Typography, Link as MuiLink } from '@material-ui/core'
import { Page, usePageStyles } from '../components/page'
import { Helmet } from 'react-helmet'
import { Link } from 'gatsby'

const NotFoundPage = ({ location }: any) => {
    const classes = usePageStyles()
    const path: string = location.pathname

    let historyReference = undefined
    let m
    if ((m = path.match(/^(?:\/tl|\/)((?:class|union|method)\/.+?)$/))) {
        historyReference = (
            <Typography variant="body1" className={classes.paragraph}>
                This type might no longer exist, but you could check{' '}
                <MuiLink component={Link} to={`/history/${m[1]}`}>
                    History section
                </MuiLink>
            </Typography>
        )
    }

    return (
        <Page>
            <Helmet>
                <title>404 Not found</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            <div className={classes.heading1}>
                <Typography variant="h3" id="tl-reference">
                    404
                </Typography>
            </div>
            <Typography variant="body1" className={classes.paragraph}>
                This page does not exist
            </Typography>
            {historyReference}
        </Page>
    )
}

export default NotFoundPage
