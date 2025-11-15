import type { tl } from '@mtcute/tl'
import type { TextWithEntities } from '../misc/entities.js'
import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer } from '../peers/peer.js'

export class TodoItem {
  constructor(
    readonly raw: tl.TypeTodoItem,
    readonly _peers: PeersIndex,
    readonly completion: tl.RawTodoCompletion | undefined,
  ) {}

  get id(): number {
    return this.raw.id
  }

  get text(): TextWithEntities {
    return this.raw.title
  }

  get isCompleted(): boolean {
    return this.completion != null
  }

  get completedBy(): Peer | null {
    if (!this.completion) return null

    const peer = parsePeer(this.completion.completedBy, this._peers)
    if (!peer) return null

    return peer
  }

  get completedDate(): Date | null {
    if (!this.completion) return null

    return new Date(this.completion.date * 1000)
  }
}

makeInspectable(TodoItem)
memoizeGetters(TodoItem, ['completedBy', 'completedDate'])

export class TodoList {
  readonly type = 'todo' as const

  constructor(
    readonly raw: tl.RawMessageMediaToDo,
    readonly _peers: PeersIndex,
  ) {}

  get othersCanAppend(): boolean {
    return this.raw.todo.othersCanAppend!
  }

  get othersCanComplete(): boolean {
    return this.raw.todo.othersCanComplete!
  }

  get title(): TextWithEntities {
    return this.raw.todo.title
  }

  get items(): TodoItem[] {
    const completionsMap = new Map<number, tl.TypeTodoCompletion>()

    this.raw.completions?.forEach((c) => {
      if (c._ === 'todoCompletion') {
        completionsMap.set(c.id, c)
      }
    })

    return this.raw.todo.list.map(i => new TodoItem(i, this._peers, completionsMap.get(i.id)))
  }

  get inputMedia(): tl.TypeInputMedia {
    return {
      _: 'inputMediaTodo',
      todo: this.raw.todo,
    }
  }
}

makeInspectable(TodoList)
memoizeGetters(TodoList, ['items'])
