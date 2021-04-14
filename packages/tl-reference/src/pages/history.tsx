import React from 'react'
import { Page, usePageStyles } from '../components/page'
import { Typography } from '@material-ui/core'

export default function HistoryPage() {
    const classes = usePageStyles()

    return (
        <Page>
            <div className={classes.heading1}>
                <Typography variant="h3" id="tl-reference">
                    History
                </Typography>
            </div>
            <Typography variant="body1" className={classes.paragraph}>
                This page is currently under construction
            </Typography>
        </Page>
    )
}
