import type { HeadConfig } from 'vitepress'
import markdownItFootnotes from 'markdown-it-footnote'
import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default ({ mode }) => defineConfig({
    title: 'mtcute',
    description: 'mtcute documentation',
    lastUpdated: true,
    head: [
        ['meta', { name: 'theme-color', content: '#e9a1d9' }],
        ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
        [
            'meta',
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
        ],
        ['link', { rel: 'icon', href: '/mtcute-logo.png' }],
        ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500&text=mtcute' }],
        ...(mode === 'production'
            ? [
                ['script', { 'async': '', 'src': 'https://zond.tei.su/script.js', 'data-website-id': '968f50a2-4cf8-4e31-9f40-1abd48ba2086' }] as HeadConfig,
            ]
            : []),
    ],
    transformHtml(code) {
        if (mode !== 'production') return code

        // this is a hack but whatever
        return code.replace(
            '<body>',
            '<body><noscript><div><img src="https://tei.su/zond.php?website=968f50a2-4cf8-4e31-9f40-1abd48ba2086" style="position:absolute; left:-9999px;" alt="" /></div></noscript>',
        )
    },
    themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Playground', link: '//play.mtcute.dev' },
            { text: 'Reference', link: '//ref.mtcute.dev' },
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/mtcute' },
            {
                icon: {
                    svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Telegram</title><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
                },
                link: 'https://t.me/mt_cute',
            },
        ],
        search: {
            provider: 'local',
        },
        editLink: {
            pattern: 'https://github.com/mtcute/docs/edit/master/:path',
        },
        outline: {
            level: 'deep',
        },

        sidebar: {
            '/guide/': [
                {
                    text: 'Getting started',
                    items: [
                        { text: 'Quick start', link: '/guide/' },
                        { text: 'Signing in', link: '/guide/intro/sign-in' },
                        { text: 'Updates', link: '/guide/intro/updates' },
                        { text: 'Errors', link: '/guide/intro/errors' },
                        {
                            text: 'MTProto vs Bot API',
                            link: '/guide/intro/mtproto-vs-bot-api',
                        },
                        { text: 'FAQ', link: '/guide/intro/faq' },
                    ],
                },
                {
                    text: 'Topics',
                    items: [
                        { text: 'Peers', link: '/guide/topics/peers' },
                        { text: 'Storage', link: '/guide/topics/storage' },
                        { text: 'Transport', link: '/guide/topics/transport' },
                        { text: 'Parse modes', link: '/guide/topics/parse-modes' },
                        { text: 'Files', link: '/guide/topics/files' },
                        { text: 'Keyboards', link: '/guide/topics/keyboards' },
                        { text: 'Inline mode', link: '/guide/topics/inline-mode' },
                        { text: 'Conversation', link: '/guide/topics/conversation' },
                        { text: 'Raw API', link: '/guide/topics/raw-api' },
                    ],
                },
                {
                    text: 'Dispatcher',
                    items: [
                        { text: 'Intro', link: '/guide/dispatcher/intro' },
                        { text: 'Handlers', link: '/guide/dispatcher/handlers' },
                        { text: 'Filters', link: '/guide/dispatcher/filters' },
                        {
                            text: 'Groups & Propagation',
                            link: '/guide/dispatcher/groups-propagation',
                        },
                        { text: 'Errors', link: '/guide/dispatcher/errors' },
                        { text: 'Middlewares', link: '/guide/dispatcher/middlewares' },
                        { text: 'Inline mode', link: '/guide/dispatcher/inline-mode' },
                        { text: 'State', link: '/guide/dispatcher/state' },
                        { text: 'Rate limit', link: '/guide/dispatcher/rate-limit' },
                        { text: 'Child Dispatchers', link: '/guide/dispatcher/children' },
                        { text: 'Scenes', link: '/guide/dispatcher/scenes' },
                        { text: 'Dependency Injection', link: '/guide/dispatcher/di' },
                    ],
                },
                {
                    text: 'Advanced',
                    items: [
                        { text: 'Tree-shaking', link: '/guide/advanced/treeshaking' },
                        { text: 'Workers', link: '/guide/advanced/workers' },
                        { text: 'Converting sessions', link: '/guide/advanced/session-convert' },
                        { text: 'Network middlewares', link: '/guide/advanced/net-middlewares' },
                        { text: 'Object serialization', link: '/guide/advanced/serialization' },
                        { text: 'Custom schema', link: '/guide/advanced/custom-schema' },
                    ],
                },
            ],
        },

        footer: {
            message: 'mtcute is not affiliated with Telegram.',
            copyright:
        'This documentation is licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a><br/>'
        + 'Logo by <a href="//t.me/AboutTheDot">@dotvhs</a><br/>'
        + '© Copyright 2021-present, <a href="//github.com/teidesu">teidesu</a> ❤️',
        },
    },

    markdown: {
        config: (md) => {
            md.use(markdownItFootnotes)
        },
    },
})
