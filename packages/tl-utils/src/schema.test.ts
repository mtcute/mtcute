import type { TlEntry } from './types.js'

import { describe, expect, it } from 'vitest'
import { writeTlEntriesToString } from './schema.js'

describe('writeTlEntriesToString', () => {
  const test = (entries: TlEntry[], params: Parameters<typeof writeTlEntriesToString>[1], ...expected: string[]) => {
    expect(
      writeTlEntriesToString(entries, {
        omitPrimitives: true,
        ...params,
      }),
    ).toEqual(expected.join('\n'))
  }

  it('computes missing ids', () => {
    const obj: TlEntry = {
      kind: 'class',
      name: 'error',
      type: 'Error',
      id: 0,
      arguments: [
        {
          name: 'code',
          type: 'int',
        },
        {
          name: 'text',
          type: 'string',
        },
      ],
    }

    test([obj], { computeIds: false }, 'error code:int text:string = Error;')
    test([obj], {}, 'error#c4b9f9bb code:int text:string = Error;')
  })

  it('writes comments along with the constructor', () => {
    const obj: TlEntry = {
      kind: 'class',
      name: 'error',
      type: 'Error',
      id: 0,
      arguments: [
        {
          name: 'code',
          type: 'int',
          comment: 'Error code',
        },
        {
          name: 'text',
          type: 'string',
          comment: 'Error description',
        },
      ],
      comment: 'An error',
    }

    test([obj], {}, '// An error', 'error#c4b9f9bb code:int text:string = Error;')

    obj.comment += '\nVery error'
    test([obj], {}, '// An error', '//- Very error', 'error#c4b9f9bb code:int text:string = Error;')
  })

  it('writes tdlib-style comments', () => {
    const obj: TlEntry = {
      kind: 'class',
      name: 'error',
      type: 'Error',
      id: 0,
      arguments: [
        {
          name: 'code',
          type: 'int',
          comment: 'Error code',
        },
        {
          name: 'text',
          type: 'string',
          comment: 'Error description',
        },
      ],
      comment: 'An error\nVery error',
    }

    test(
      [obj],
      { tdlibComments: true },
      '// @description An error',
      '//- Very error',
      '// @code Error code',
      '// @text Error description',
      'error#c4b9f9bb code:int text:string = Error;',
    )
  })

  it('inserts kind annotation when kind changes', () => {
    const cls: TlEntry = {
      kind: 'class',
      name: 'error',
      type: 'Error',
      id: 0,
      arguments: [
        {
          name: 'code',
          type: 'int',
        },
        {
          name: 'text',
          type: 'string',
        },
      ],
    }
    const method: TlEntry = {
      ...cls,
      kind: 'method',
    }

    test(
      [method, cls, cls, method, cls],
      {},
      '---functions---',
      'error#c4b9f9bb code:int text:string = Error;',
      '---types---',
      'error#c4b9f9bb code:int text:string = Error;',
      'error#c4b9f9bb code:int text:string = Error;',
      '---functions---',
      'error#c4b9f9bb code:int text:string = Error;',
      '---types---',
      'error#c4b9f9bb code:int text:string = Error;',
    )
  })
})
