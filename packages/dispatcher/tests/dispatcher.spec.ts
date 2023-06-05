import { expect } from 'chai'
import { describe, it } from 'mocha'

import { PeersIndex, TelegramClient } from '@mtcute/client'

import { Dispatcher, PropagationAction } from '../src'

describe('Dispatcher', () => {
    // todo: replace with proper mocked TelegramClient
    const client = new TelegramClient({ apiId: 0, apiHash: '' })
    const emptyPeers = new PeersIndex()

    describe('Raw updates', () => {
        it('registers and unregisters handlers for raw updates', async () => {
            const dp = new Dispatcher(client)
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

            expect(log).eql([
                '(first) received updateConfig',
                '(second) received updateConfig',
            ])
        })

        it('supports filters for raw updates', async () => {
            const dp = new Dispatcher(client)

            const log: string[] = []

            dp.onRawUpdate((cl, upd) => {
                log.push('(no) received ' + upd._)

                return PropagationAction.Continue
            })

            dp.onRawUpdate(
                () => true,
                (cl, upd) => {
                    log.push('(true) received ' + upd._)

                    return PropagationAction.Continue
                },
            )

            dp.onRawUpdate(
                () => false,
                (cl, upd) => {
                    log.push('(false) received ' + upd._)

                    return PropagationAction.Continue
                },
            )

            await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

            expect(log).eql([
                '(no) received updateConfig',
                '(true) received updateConfig',
            ])
        })
    })

    // todo: other update types

    describe('Filter groups', () => {
        it('does separate propagation for filter groups', async () => {
            const dp = new Dispatcher(client)

            const log: string[] = []

            dp.onRawUpdate((cl, upd) => {
                log.push('(grp0) received ' + upd._)
            }, 0)
            dp.onRawUpdate((cl, upd) => {
                log.push('(grp0 2) received ' + upd._)
            }, 0)
            dp.onRawUpdate((cl, upd) => {
                log.push('(grp1) received ' + upd._)
            }, 1)
            dp.onRawUpdate((cl, upd) => {
                log.push('(grp2) received ' + upd._)
            }, 2)

            await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

            expect(log).eql([
                '(grp0) received updateConfig',
                '(grp1) received updateConfig',
                '(grp2) received updateConfig',
            ])
        })

        it('allows continuing propagation in the same group with ContinuePropagation', async () => {
            const dp = new Dispatcher(client)

            const log: string[] = []

            dp.onRawUpdate((cl, upd) => {
                log.push('(grp0) received ' + upd._)

                return PropagationAction.Continue
            }, 0)
            dp.onRawUpdate((cl, upd) => {
                log.push('(grp0 2) received ' + upd._)
            }, 0)
            dp.onRawUpdate((cl, upd) => {
                log.push('(grp1) received ' + upd._)
            }, 1)
            dp.onRawUpdate((cl, upd) => {
                log.push('(grp1 2) received ' + upd._)
            }, 1)
            dp.onRawUpdate((cl, upd) => {
                log.push('(grp2) received ' + upd._)
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
            const dp = new Dispatcher(client)

            const log: string[] = []

            dp.onRawUpdate((cl, upd) => {
                log.push('(grp0) received ' + upd._)

                return PropagationAction.Continue
            }, 0)
            dp.onRawUpdate((cl, upd) => {
                log.push('(grp0 2) received ' + upd._)
            }, 0)
            dp.onRawUpdate((cl, upd) => {
                log.push('(grp1) received ' + upd._)

                return PropagationAction.Stop
            }, 1)
            dp.onRawUpdate((cl, upd) => {
                log.push('(grp1 2) received ' + upd._)
            }, 1)
            dp.onRawUpdate((cl, upd) => {
                log.push('(grp2) received ' + upd._)
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
            const dp = new Dispatcher(client)
            const child = new Dispatcher()
            dp.addChild(child)

            const log: string[] = []

            dp.onRawUpdate((cl, upd) => {
                log.push('(parent) received ' + upd._)
            })

            child.onRawUpdate((cl, upd) => {
                log.push('(child) received ' + upd._)
            })

            await dp.dispatchRawUpdateNow({ _: 'updateConfig' }, emptyPeers)

            expect(log).eql([
                '(parent) received updateConfig',
                '(child) received updateConfig',
            ])
        })

        it('should have separate handler groups for children', async () => {
            const dp = new Dispatcher(client)
            const child = new Dispatcher()
            dp.addChild(child)

            const log: string[] = []

            dp.onRawUpdate((cl, upd) => {
                log.push('(parent 0) received ' + upd._)

                return PropagationAction.Continue
            }, 0)

            dp.onRawUpdate((cl, upd) => {
                log.push('(parent 1) received ' + upd._)

                return PropagationAction.Stop
            }, 1)

            dp.onRawUpdate((cl, upd) => {
                log.push('(parent 2) received ' + upd._)
            }, 1)

            child.onRawUpdate((cl, upd) => {
                log.push('(child 0) received ' + upd._)

                return PropagationAction.Continue
            }, 0)

            child.onRawUpdate((cl, upd) => {
                log.push('(child 1) received ' + upd._)

                return PropagationAction.Stop
            }, 1)

            child.onRawUpdate((cl, upd) => {
                log.push('(child 2) received ' + upd._)
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
})
