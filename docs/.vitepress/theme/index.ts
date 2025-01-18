// https://vitepress.dev/guide/custom-theme
import type { Theme } from 'vitepress'
import vitepressBackToTop from 'vitepress-plugin-back-to-top'

import DefaultTheme from 'vitepress/theme'
import EmbedPost from '../components/EmbedPost.vue'

import Tag from '../components/Tag.vue'
import VImg from '../components/VImg.vue'
import Layout from './Layout.vue'
import 'vitepress-plugin-back-to-top/dist/style.css'

import './style.css'

export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }) {
        app.component('v-img', VImg)
        app.component('EmbedPost', EmbedPost)
        app.component('Tag', Tag)
        vitepressBackToTop({
            threshold: 300,
        })
    },
} satisfies Theme
