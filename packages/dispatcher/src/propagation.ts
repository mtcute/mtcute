/**
 * Propagation action.
 *
 * `Stop`: Stop the propagation of the event through any handler groups
 * in the current dispatcher. Does not prevent child dispatchers from
 * being executed.
 *
 * `StopChildren`: Stop the propagation of the event through any handler groups
 * in the current dispatcher, and any of its children. If current dispatcher
 * is a child, does not prevent from propagating to its siblings.
 *
 * `Continue`: Continue propagating the event inside the same handler group.
 *
 * `ToScene`: Used after using `state.enter()` to dispatch the update to the scene,
 * or after `state.exit()` to dispatch the update to the root dispatcher.
 */
export enum PropagationAction {
  Stop = 'stop',
  StopChildren = 'stop-children',
  Continue = 'continue',
  ToScene = 'scene',
}
