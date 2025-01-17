// https://vitepress.dev/guide/custom-theme
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import vitepressBackToTop from 'vitepress-plugin-back-to-top'
import 'vitepress-plugin-back-to-top/dist/style.css'

// @ts-ignore
import EmbedPost from '../components/EmbedPost.vue'
// @ts-ignore
import VImg from '../components/VImg.vue'
// @ts-ignore
import Tag from '../components/Tag.vue'
// @ts-ignore
import Layout from './Layout.vue'

import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {
    app.component('v-img', VImg)
    app.component('EmbedPost', EmbedPost)
    app.component('Tag', Tag)
    vitepressBackToTop({
      threshold: 300
    })
  }
} satisfies Theme
