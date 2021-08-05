import React from 'react'
import { Page, Section, usePageStyles } from '../components/page'
import { Link as MuiLink, Typography } from '@material-ui/core'
import { Helmet } from 'react-helmet'
import { graphql, Link } from 'gatsby'

interface GraphqlResult {
    layers: {
        nodes: {
            layer: number
            rev: number
            source: {
                date: string
                commit: string
                website: boolean
                file: string
            }
        }[]
    }
}

export default function HistoryPage({ data }: { data: GraphqlResult }) {
    const classes = usePageStyles()

    data.layers.nodes.sort((a, b) =>
        a.layer === b.layer ? b.rev - a.rev : b.layer - a.layer
    )

    return (
        <Page>
            <Helmet>
                <title>History</title>
            </Helmet>

            <div className={classes.heading1}>
                <Typography variant="h3" id="tl-reference">
                    History
                </Typography>
            </div>
            <Typography variant="body1" className={classes.paragraph}>
                In this section of the website, you can explore history of the
                TL schema, and how it changed over the time.
                <br />
                <br />
                Schemas are fetched automatically from <code>
                    tdesktop
                </code>{' '}
                repository, and older schemas (&lt;14) are fetched directly from
                Telegram's website.
                <br />
                <br />
                Note that schemas for MTCute are merged from Telegram Desktop
                and TDLib repositories, and thus may not be exactly the same as
                in history.
            </Typography>

            <Section id="schemas" title="Schemas">
                {data.layers.nodes.map((layer) => (
                    <Typography variant="h5">
                        <MuiLink
                            component={Link}
                            to={`/history/layer${layer.layer}${
                                layer.rev ? `-rev${layer.rev}` : ''
                            }`}
                        >
                            Layer {layer.layer}
                            {layer.rev > 0 && (
                                <span className={classes.rev}>
                                    {' '}
                                    rev. {layer.rev}
                                </span>
                            )}
                        </MuiLink>

                        <small>
                            {' '}
                            (from{' '}
                            {layer.source.website
                                ? 'website'
                                : layer.source.date}
                            )
                        </small>
                    </Typography>
                ))}
            </Section>
        </Page>
    )
}

export const query = graphql`
    query {
        layers: allHistoryJson {
            nodes {
                layer
                rev
                source {
                    website
                    date(formatString: "DD-MM-YYYY")
                    commit
                    file
                }
            }
        }
    }
`
