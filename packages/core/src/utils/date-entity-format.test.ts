import { describe, expect, it } from 'vitest'

import { dateEntityFormatToString, parseDateEntityFormat } from './date-entity-format.js'

describe('parseDateEntityFormat', () => {
  it('should parse relative format', () => {
    expect(parseDateEntityFormat('r')).toEqual({ relative: true })
    expect(parseDateEntityFormat('R')).toEqual({ relative: true })
  })

  it('should parse individual flags', () => {
    expect(parseDateEntityFormat('t')).toEqual({ shortTime: true })
    expect(parseDateEntityFormat('T')).toEqual({ longTime: true })
    expect(parseDateEntityFormat('d')).toEqual({ shortDate: true })
    expect(parseDateEntityFormat('D')).toEqual({ longDate: true })
    expect(parseDateEntityFormat('w')).toEqual({ dayOfWeek: true })
    expect(parseDateEntityFormat('W')).toEqual({ dayOfWeek: true })
  })

  it('should parse combined flags', () => {
    expect(parseDateEntityFormat('wDt')).toEqual({ dayOfWeek: true, longDate: true, shortTime: true })
    expect(parseDateEntityFormat('dT')).toEqual({ shortDate: true, longTime: true })
  })

  it('should parse empty string', () => {
    expect(parseDateEntityFormat('')).toEqual({})
  })

  it('should throw on invalid characters', () => {
    expect(() => parseDateEntityFormat('x')).toThrow('Invalid date format character: x')
  })
})

describe('dateEntityFormatToString', () => {
  it('should convert relative flag', () => {
    expect(dateEntityFormatToString({ relative: true })).toBe('r')
  })

  it('should convert individual flags', () => {
    expect(dateEntityFormatToString({ shortTime: true })).toBe('t')
    expect(dateEntityFormatToString({ longDate: true })).toBe('D')
  })

  it('should convert combined flags in correct order', () => {
    expect(dateEntityFormatToString({ dayOfWeek: true, longDate: true, shortTime: true })).toBe('wDt')
  })

  it('should return empty string for no flags', () => {
    expect(dateEntityFormatToString({ })).toBe('')
  })
})
