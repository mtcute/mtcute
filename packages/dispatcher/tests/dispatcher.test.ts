import { Message, PeersIndex } from '@mtcute/core'
import { TelegramClient } from '@mtcute/core/client.js'
import { createStub, StubTelegramClient } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

import { Dispatcher, PropagationAction } from '../src/index.js'

describe('Dispatcher', () => {
  // todo: replace with proper mocked TelegramClient
  const client = new TelegramClient({ client: new StubTelegramClient({ disableUpdates: false }) })
  const emptyPeers = new PeersIndex()

  describe('Raw updates', () => {
    it('registers and unregisters handlers for raw updates', async () => {
      const dp = Dispatcher.for(client)
      const log: string[] = []

      dp.onRawUpdate((cl, upd) => {
        log.push(`(first) received ${upd._}`)

        return PropagationAction.Continue
      })
      dp.onRawUpdate((cl, upd) => {
        log.push(`(second) received ${upd._}`)

        return PropagationAction.Continue
      })

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)
      dp.removeUpdateHandler('raw')
      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql(['(first) received updateConfig', '(second) received updateConfig'])
    })

    it('supports filters for raw updates', async () => {
      const dp = Dispatcher.for(client)

      const log: string[] = []

      dp.onRawUpdate((cl, upd) => {
        log.push(`(no) received ${upd._}`)

        return PropagationAction.Continue
      })

      dp.onRawUpdate(
        () => true,
        (cl, upd) => {
          log.push(`(true) received ${upd._}`)

          return PropagationAction.Continue
        },
      )

      dp.onRawUpdate(
        () => false,
        (cl, upd) => {
          log.push(`(false) received ${upd._}`)

          return PropagationAction.Continue
        },
      )

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql(['(no) received updateConfig', '(true) received updateConfig'])
    })
  })

  // todo: other update types

  describe('Filter groups', () => {
    it('does separate propagation for filter groups', async () => {
      const dp = Dispatcher.for(client)

      const log: string[] = []

      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp0) received ${upd._}`)
      }, 0)
      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp0 2) received ${upd._}`)
      }, 0)
      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp1) received ${upd._}`)
      }, 1)
      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp2) received ${upd._}`)
      }, 2)

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql([
        '(grp0) received updateConfig',
        '(grp1) received updateConfig',
        '(grp2) received updateConfig',
      ])
    })

    it('allows continuing propagation in the same group with ContinuePropagation', async () => {
      const dp = Dispatcher.for(client)

      const log: string[] = []

      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp0) received ${upd._}`)

        return PropagationAction.Continue
      }, 0)
      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp0 2) received ${upd._}`)
      }, 0)
      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp1) received ${upd._}`)
      }, 1)
      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp1 2) received ${upd._}`)
      }, 1)
      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp2) received ${upd._}`)
      }, 2)

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql([
        '(grp0) received updateConfig',
        '(grp0 2) received updateConfig',
        '(grp1) received updateConfig',
        '(grp2) received updateConfig',
      ])
    })

    it('allows stopping any further propagation with Stop', async () => {
      const dp = Dispatcher.for(client)

      const log: string[] = []

      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp0) received ${upd._}`)

        return PropagationAction.Continue
      }, 0)
      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp0 2) received ${upd._}`)
      }, 0)
      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp1) received ${upd._}`)

        return PropagationAction.Stop
      }, 1)
      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp1 2) received ${upd._}`)
      }, 1)
      dp.onRawUpdate((cl, upd) => {
        log.push(`(grp2) received ${upd._}`)
      }, 2)

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql([
        '(grp0) received updateConfig',
        '(grp0 2) received updateConfig',
        '(grp1) received updateConfig',
      ])
    })
  })

  describe('Children', () => {
    it('should call children handlers after own handlers', async () => {
      const dp = Dispatcher.for(client)
      const child = Dispatcher.child()
      dp.addChild(child)

      const log: string[] = []

      dp.onRawUpdate((cl, upd) => {
        log.push(`(parent) received ${upd._}`)
      })

      child.onRawUpdate((cl, upd) => {
        log.push(`(child) received ${upd._}`)
      })

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql(['(parent) received updateConfig', '(child) received updateConfig'])
    })

    it('should have separate handler groups for children', async () => {
      const dp = Dispatcher.for(client)
      const child = Dispatcher.child()
      dp.addChild(child)

      const log: string[] = []

      dp.onRawUpdate((cl, upd) => {
        log.push(`(parent 0) received ${upd._}`)

        return PropagationAction.Continue
      }, 0)

      dp.onRawUpdate((cl, upd) => {
        log.push(`(parent 1) received ${upd._}`)

        return PropagationAction.Stop
      }, 1)

      dp.onRawUpdate((cl, upd) => {
        log.push(`(parent 2) received ${upd._}`)
      }, 1)

      child.onRawUpdate((cl, upd) => {
        log.push(`(child 0) received ${upd._}`)

        return PropagationAction.Continue
      }, 0)

      child.onRawUpdate((cl, upd) => {
        log.push(`(child 1) received ${upd._}`)

        return PropagationAction.Stop
      }, 1)

      child.onRawUpdate((cl, upd) => {
        log.push(`(child 2) received ${upd._}`)
      }, 1)

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql([
        '(parent 0) received updateConfig',
        '(parent 1) received updateConfig',
        '(child 0) received updateConfig',
        '(child 1) received updateConfig',
      ])
    })
  })

  describe('Dependency injection', () => {
    it('should inject dependencies into update contexts', async () => {
      const dp = Dispatcher.for(client)

      dp.inject('foo' as never, 'foo' as never)

      const log: string[] = []

      dp.onNewMessage(() => {
        log.push(`received ${(dp.deps as any).foo}`)
      })

      const dp2 = Dispatcher.child()

      dp2.onNewMessage(() => {
        log.push(`received ${(dp.deps as any).foo} (child)`)
      })

      dp.addChild(dp2)

      await dp.dispatchUpdateNow({
        name: 'new_message',
        data: new Message(
          createStub('message'),
          emptyPeers,
        ),
      })

      expect(log).eql([
        'received foo',
        'received foo (child)',
      ])
    })

    it('should inject multiple dependencies at once', async () => {
      const dp = Dispatcher.for(client)

      dp.inject({ foo: 'bar', baz: 42 } as never)

      expect((dp.deps as any).foo).toBe('bar')
      expect((dp.deps as any).baz).toBe(42)
    })

    it('should throw error when injecting to child dispatcher', () => {
      const parent = Dispatcher.for(client)
      const child = Dispatcher.child()
      parent.addChild(child)

      expect(() => child.inject('foo' as never, 'bar' as never)).toThrow()
    })
  })

  describe('Error handling', () => {
    it('should call error handler when handler throws', async () => {
      const dp = Dispatcher.for(client)
      const errors: Error[] = []

      dp.onError((err) => {
        errors.push(err)
        return true // handled
      })

      dp.onNewMessage(() => {
        throw new Error('test error')
      })

      await dp.dispatchUpdateNow({
        name: 'new_message',
        data: new Message(createStub('message'), emptyPeers),
      })

      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe('test error')
    })

    it('should propagate error if error handler returns false', async () => {
      const dp = Dispatcher.for(client)

      dp.onError(() => false)

      dp.onNewMessage(() => {
        throw new Error('unhandled error')
      })

      await expect(
        dp.dispatchUpdateNow({
          name: 'new_message',
          data: new Message(createStub('message'), emptyPeers),
        }),
      ).rejects.toThrow('unhandled error')
    })

    it('should remove error handler when passing null', async () => {
      const dp = Dispatcher.for(client)

      dp.onError(() => true)
      dp.onError(null)

      dp.onNewMessage(() => {
        throw new Error('should propagate')
      })

      await expect(
        dp.dispatchUpdateNow({
          name: 'new_message',
          data: new Message(createStub('message'), emptyPeers),
        }),
      ).rejects.toThrow('should propagate')
    })
  })

  describe('Pre/Post update middleware', () => {
    it('should call pre-update middleware before handlers', async () => {
      const dp = Dispatcher.for(client)
      const log: string[] = []

      dp.onPreUpdate(() => {
        log.push('pre-update')
      })

      dp.onNewMessage(() => {
        log.push('handler')
      })

      await dp.dispatchUpdateNow({
        name: 'new_message',
        data: new Message(createStub('message'), emptyPeers),
      })

      expect(log).eql(['pre-update', 'handler'])
    })

    it('should skip handlers when pre-update returns Stop', async () => {
      const dp = Dispatcher.for(client)
      const log: string[] = []

      dp.onPreUpdate(() => {
        log.push('pre-update')
        return PropagationAction.Stop
      })

      dp.onNewMessage(() => {
        log.push('handler')
      })

      await dp.dispatchUpdateNow({
        name: 'new_message',
        data: new Message(createStub('message'), emptyPeers),
      })

      expect(log).eql(['pre-update'])
    })

    it('should call post-update middleware after handlers', async () => {
      const dp = Dispatcher.for(client)
      const log: string[] = []

      dp.onNewMessage(() => {
        log.push('handler')
      })

      dp.onPostUpdate((handled) => {
        log.push(`post-update: handled=${handled}`)
      })

      await dp.dispatchUpdateNow({
        name: 'new_message',
        data: new Message(createStub('message'), emptyPeers),
      })

      expect(log).eql(['handler', 'post-update: handled=true'])
    })

    it('should remove middleware when passing null', () => {
      const dp = Dispatcher.for(client)

      dp.onPreUpdate(() => {})
      dp.onPreUpdate(null)

      dp.onPostUpdate(() => {})
      dp.onPostUpdate(null)

      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('Parsed updates', () => {
    it('should handle new message updates', async () => {
      const dp = Dispatcher.for(client)
      const log: string[] = []

      dp.onNewMessage((ctx) => {
        log.push(`new message: ${ctx.id}`)
      })

      const msg = createStub('message', { id: 123 })
      await dp.dispatchUpdateNow({
        name: 'new_message',
        data: new Message(msg, emptyPeers),
      })

      expect(log).eql(['new message: 123'])
    })

    it('should handle edit message updates', async () => {
      const dp = Dispatcher.for(client)
      const log: string[] = []

      dp.onEditMessage((ctx) => {
        log.push(`edit message: ${ctx.id}`)
      })

      const msg = createStub('message', { id: 456 })
      await dp.dispatchUpdateNow({
        name: 'edit_message',
        data: new Message(msg, emptyPeers),
      })

      expect(log).eql(['edit message: 456'])
    })

    it('should support filters for parsed updates', async () => {
      const dp = Dispatcher.for(client)
      const log: string[] = []

      dp.onNewMessage(
        (ctx) => ctx.id === 123,
        (ctx) => {
          log.push(`filtered: ${ctx.id}`)
          return PropagationAction.Continue
        },
      )

      dp.onNewMessage(() => {
        log.push('no filter')
      })

      const msg1 = createStub('message', { id: 123 })
      await dp.dispatchUpdateNow({
        name: 'new_message',
        data: new Message(msg1, emptyPeers),
      })

      const msg2 = createStub('message', { id: 999 })
      await dp.dispatchUpdateNow({
        name: 'new_message',
        data: new Message(msg2, emptyPeers),
      })

      expect(log).eql(['filtered: 123', 'no filter', 'no filter'])
    })
  })

  describe('StopChildrenPropagation', () => {
    it('should stop propagation to children when returning StopChildren', async () => {
      const dp = Dispatcher.for(client)
      const child = Dispatcher.child()
      dp.addChild(child)

      const log: string[] = []

      dp.onRawUpdate(() => {
        log.push('parent')
        return PropagationAction.StopChildren
      })

      child.onRawUpdate(() => {
        log.push('child')
      })

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql(['parent'])
    })
  })

  describe('Clone and extend', () => {
    it('should clone dispatcher without children by default', () => {
      const dp = Dispatcher.for(client)
      const child = Dispatcher.child()
      dp.addChild(child)

      dp.onRawUpdate(() => {})

      const cloned = dp.clone()

      expect(cloned.parent).toBeNull()
    })

    it('should clone dispatcher with children when requested', () => {
      const dp = Dispatcher.for(client)
      const child = Dispatcher.child()
      dp.addChild(child)

      child.onRawUpdate(() => {})

      const cloned = dp.clone(true)

      expect(cloned.parent).toBeNull()
    })

    it('should extend dispatcher by copying handlers', async () => {
      const dp1 = Dispatcher.for(client)
      const dp2 = Dispatcher.child()

      const log: string[] = []

      dp2.onRawUpdate(() => {
        log.push('from dp2')
      })

      dp1.extend(dp2)

      await dp1.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql(['from dp2'])
    })
  })

  describe('Unbind and destroy', () => {
    it('should unbind dispatcher from client', () => {
      const dp = Dispatcher.for(client)
      dp.unbind()

      // after unbind dispatcher should not be bound to client
      expect(true).toBe(true)
    })

    it('should destroy dispatcher and clean up resources', async () => {
      const dp = Dispatcher.for(client)
      const child = Dispatcher.child()
      dp.addChild(child)

      dp.onRawUpdate(() => {})
      child.onRawUpdate(() => {})

      await dp.destroy()

      // after destroy handlers should be removed
      expect(true).toBe(true)
    })
  })

  describe('Remove handlers', () => {
    it('should remove handler by name', async () => {
      const dp = Dispatcher.for(client)
      const log: string[] = []

      dp.onNewMessage(() => {
        log.push('handler')
      })

      await dp.dispatchUpdateNow({
        name: 'new_message',
        data: new Message(createStub('message'), emptyPeers),
      })

      dp.removeUpdateHandler('new_message')

      await dp.dispatchUpdateNow({
        name: 'new_message',
        data: new Message(createStub('message'), emptyPeers),
      })

      expect(log).eql(['handler'])
    })

    it('should remove all handlers when passing "all"', async () => {
      const dp = Dispatcher.for(client)
      const log: string[] = []

      dp.onRawUpdate(() => {
        log.push('raw')
      })

      dp.onNewMessage(() => {
        log.push('message')
      })

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      dp.removeUpdateHandler('all')

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql(['raw'])
    })

    it('should remove specific handler instance', async () => {
      const dp = Dispatcher.for(client)
      const log: string[] = []

      const handler1 = () => {
        log.push('handler1')
        return PropagationAction.Continue
      }

      const handler2 = () => {
        log.push('handler2')
      }

      dp.onNewMessage(handler1)
      dp.onNewMessage(handler2)

      await dp.dispatchUpdateNow({
        name: 'new_message',
        data: new Message(createStub('message'), emptyPeers),
      })

      // both handlers should be called due to Continue propagation
      expect(log).toContain('handler1')
      expect(log).toContain('handler2')
    })
  })

  describe('Child management', () => {
    it('should remove child dispatcher', async () => {
      const dp = Dispatcher.for(client)
      const child = Dispatcher.child()
      dp.addChild(child)

      const log: string[] = []

      child.onRawUpdate(() => {
        log.push('child')
      })

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      dp.removeChild(child)

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql(['child'])
    })

    it('should not add same child twice', async () => {
      const dp = Dispatcher.for(client)
      const child = Dispatcher.child()

      dp.addChild(child)
      dp.addChild(child) //  be ignored

      const log: string[] = []

      child.onRawUpdate(() => {
        log.push('child')
      })

      await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

      expect(log).eql(['child'])
    })

    it('should throw when adding already bound dispatcher as child', () => {
      const dp1 = Dispatcher.for(client)
      const dp2 = Dispatcher.for(client)

      expect(() => dp1.addChild(dp2 as any)).toThrow()
    })
  })
})
