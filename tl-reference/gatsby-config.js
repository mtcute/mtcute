module.exports = {
    siteMetadata: {
        title: 'TL reference',
    },
    pathPrefix: '/tl',
    plugins: [
        'gatsby-theme-material-ui',
        'gatsby-transformer-json',
        'gatsby-plugin-sass',
        'gatsby-plugin-react-helmet',
        {
            resolve: 'gatsby-plugin-nprogress',
            options: {
                color: 'white'
            },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                path: './data',
                ignore: [
                    './data/history/last-fetched.json',
                    './data/README.md',
                ],
            },
        },
        {
            resolve: 'gatsby-plugin-layout',
            options: {
                component: require.resolve('./src/layout.tsx'),
            },
        },
    ],
}
