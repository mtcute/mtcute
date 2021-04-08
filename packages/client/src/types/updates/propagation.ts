const _sym = require('es6-symbol')

export const StopPropagation: unique symbol = _sym.for('mtcute:StopPropagation')
export const ContinuePropagation: unique symbol = _sym.for(
    'mtcute:ContinuePropagation'
)

export type PropagationSymbol =
    | typeof StopPropagation
    | typeof ContinuePropagation
