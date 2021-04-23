const _sym = require('es6-symbol')

/**
 * Stop the propagation of the event through any handler groups
 * on the current dispatcher.
 *
 * However, returning this will still execute children
 */
export const StopPropagation: unique symbol = _sym.for('mtcute:StopPropagation')

/**
 * Stop the propagation of the event through any handler groups
 * on the current dispatcher, and any of its children.
 *
 * Note that if current dispatcher is a child,
 * this will not prevent from propagating the event
 * to other children of current's parent.
 */
export const StopChildrenPropagation: unique symbol = _sym.for(
    'mtcute:StopChildrenPropagation'
)

/**
 * Continue propagating the event inside the same handler group.
 */
export const ContinuePropagation: unique symbol = _sym.for(
    'mtcute:ContinuePropagation'
)

export type PropagationSymbol =
    | typeof StopPropagation
    | typeof ContinuePropagation
    | typeof StopChildrenPropagation
