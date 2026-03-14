import type { TimersManager } from '../managers/timers.js'
import type { WorkerInvoker } from './invoker.js'

interface WorkerTimersTarget extends Pick<TimersManager, 'upsert' | 'cancel' | 'exists'> {}

export class WorkerTimersManager implements WorkerTimersTarget {
  readonly upsert: TimersManager['upsert']
  readonly cancel: TimersManager['cancel']
  readonly exists: TimersManager['exists']

  constructor(invoker: WorkerInvoker) {
    const bind = invoker.makeBinder<WorkerTimersTarget>('timers')

    this.upsert = bind('upsert')
    this.cancel = bind('cancel')
    this.exists = bind('exists')
  }
}
