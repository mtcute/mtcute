import { describe, expect, it } from 'vitest'

import { generateCodeForErrors } from './errors.js'

describe('generateCodeForErrors', () => {
  it('should correctly generate errors', () => {
    expect(
      generateCodeForErrors({
        base: { BAD_REQUEST: 400 },
        errors: {
          'USER_NOT_FOUND': { code: 400, name: 'USER_NOT_FOUND' },
          'FLOOD_WAIT_%d': { code: 420, name: 'FLOOD_WAIT_%d', description: 'Wait %d seconds' },
        },
        throws: {},
        userOnly: {},
        botOnly: {},
      }),
    ).toMatchSnapshot()
  })
})
