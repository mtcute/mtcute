import type { tl } from '@mtcute/tl'

export abstract class StoryInteractiveArea {
  abstract type: string

  constructor(readonly raw: tl.TypeMediaArea) {
    this.raw = raw
  }

  /** X coordinate of the top-left corner of the area */
  get x(): number {
    return this.raw.coordinates.x
  }

  /** Y coordinate of the top-left corner of the area */
  get y(): number {
    return this.raw.coordinates.y
  }

  /** Width of the area */
  get width(): number {
    return this.raw.coordinates.w
  }

  /** Height of the area */
  get height(): number {
    return this.raw.coordinates.h
  }

  /** Rotation of the area */
  get rotation(): number {
    return this.raw.coordinates.rotation
  }
}
