import { JSX } from 'typedoc'

const WEBSITE_ID = '4aac3220-0450-44d6-9d0c-8fe7fe8e62bd'
const UMAMI_URL = 'https://zond.tei.su'
const UMAMI_NOSCRIPT = `https://tei.su/zond.php?website=${WEBSITE_ID}`

const { createElement: h } = JSX

export function load(app) {
  app.renderer.hooks.on('head.end', () => {
    return h('script', {
      'async': true,
      'src': `${UMAMI_URL}/script.js`,
      'data-website-id': WEBSITE_ID,
    })
  })
  app.renderer.hooks.on('body.begin', () => {
    return h(
      'noscript',
      null,
      h('div', null, h('img', { src: UMAMI_NOSCRIPT, style: 'position:absolute; left:-9999px;' })),
    )
  })
}
