import { describe, expect, it } from 'vitest'

import { camelToPascal, indent, jsComment, snakeToCamel } from './utils.js'

describe('snakeToCamel', () => {
  it('should convert snake_case to camelCase', () => {
    expect(snakeToCamel('snake_case')).toEqual('snakeCase')
  })

  it('should correctly handle numbers', () => {
    expect(snakeToCamel('snake_case_123')).toEqual('snakeCase123')
    expect(snakeToCamel('snake_case123')).toEqual('snakeCase123')
  })
})

describe('camelToPascal', () => {
  it('should convert camelCase to PascalCase', () => {
    expect(camelToPascal('camelCase')).toEqual('CamelCase')
  })

  it('should correctly handle numbers', () => {
    expect(camelToPascal('camelCase123')).toEqual('CamelCase123')
  })
})

describe('jsComment', () => {
  it('should format comments correctly', () => {
    expect(jsComment('This is a comment')).toEqual('/**\n * This is a comment\n */')
  })

  it('should wrap long comments correctly', () => {
    expect(jsComment('This is a very long comment which should be wrapped around here')).toEqual(
      '/**\n * This is a very long comment which should be wrapped around\n * here\n */',
    )
  })

  it('should not break up links', () => {
    expect(jsComment('This is a very long comment that wraps nearby a {@link link} yeah')).toEqual(
      '/**\n * This is a very long comment that wraps nearby a {@link link}\n * yeah\n */',
    )
    expect(jsComment('This is a very long comment that wraps nearby this {@link link} yeah')).toEqual(
      '/**\n * This is a very long comment that wraps nearby this\n * {@link link} yeah\n */',
    )
  })
})

describe('indent', () => {
  it('should indent correctly', () => {
    expect(indent(4, 'This is a comment')).toEqual('    This is a comment')
  })

  it('should indent correctly with multiple lines', () => {
    expect(indent(4, 'This is a comment\nThis is another comment')).toEqual(
      '    This is a comment\n    This is another comment',
    )
  })
})
