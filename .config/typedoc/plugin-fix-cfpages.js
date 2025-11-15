import { KindRouter, ReflectionKind } from 'typedoc'

// (tldr: /functions/ is treated incorrectly on cloudflare pages, rename it to /funcs/)
class FixedKindRouter extends KindRouter {
  constructor(renderer) {
    super(renderer)
    this.directories.set(ReflectionKind.Function, 'funcs')
  }
}

/** @param {import('typedoc').Application} app */
export function load(app) {
  app.renderer.routers.set('kind', FixedKindRouter)
}
