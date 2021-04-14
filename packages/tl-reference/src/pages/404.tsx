import * as React from 'react'
import { Typography } from '@material-ui/core'
import { Page, usePageStyles } from '../components/page'
import { Helmet } from 'react-helmet'

const NotFoundPage = () => {
    const classes = usePageStyles()

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
        </Page>
    )
}

export default NotFoundPage
