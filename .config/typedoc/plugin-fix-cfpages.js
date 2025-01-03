import { DefaultTheme } from 'typedoc'

class FixedTheme extends DefaultTheme {
    constructor(renderer) {
        super(renderer)
        this.mappings.find(it => it.directory === 'functions').directory = 'funcs'
    }
}

export function load(app) {
    // https://github.com/TypeStrong/typedoc/issues/2111
    // https://github.com/cloudflare/workers-sdk/issues/2240
    // (tldr: /functions/ is treated incorrectly on cloudflare pages)
    app.renderer.themes.set('default', FixedTheme)
}
