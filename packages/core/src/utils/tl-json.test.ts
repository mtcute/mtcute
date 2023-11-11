import { describe, expect, it } from 'vitest'

import { jsonToTlJson, tlJsonToJson } from './tl-json.js'

describe('jsonToTlJson', () => {
    it('should correctly handle null/undefined', () => {
        expect(jsonToTlJson(null)).toEqual({ _: 'jsonNull' })
        expect(jsonToTlJson(undefined)).toEqual({ _: 'jsonNull' })
    })

    it('should correctly handle booleans', () => {
        expect(jsonToTlJson(true)).toEqual({ _: 'jsonBool', value: true })
        expect(jsonToTlJson(false)).toEqual({ _: 'jsonBool', value: false })
    })

    it('should correctly handle numbers', () => {
        expect(jsonToTlJson(123)).toEqual({ _: 'jsonNumber', value: 123 })
        expect(jsonToTlJson(0)).toEqual({ _: 'jsonNumber', value: 0 })
        expect(jsonToTlJson(-123)).toEqual({ _: 'jsonNumber', value: -123 })
    })

    it('should correctly handle strings', () => {
        expect(jsonToTlJson('hello')).toEqual({ _: 'jsonString', value: 'hello' })
        expect(jsonToTlJson('')).toEqual({ _: 'jsonString', value: '' })
    })

    it('should correcly handle arrays', () => {
        expect(jsonToTlJson([1, 2, 3])).toEqual({
            _: 'jsonArray',
            value: [
                { _: 'jsonNumber', value: 1 },
                { _: 'jsonNumber', value: 2 },
                { _: 'jsonNumber', value: 3 },
            ],
        })
    })

    it('should correctly handle objects', () => {
        expect(jsonToTlJson({ a: 1, b: 2 })).toEqual({
            _: 'jsonObject',
            value: [
                { _: 'jsonObjectValue', key: 'a', value: { _: 'jsonNumber', value: 1 } },
                { _: 'jsonObjectValue', key: 'b', value: { _: 'jsonNumber', value: 2 } },
            ],
        })
    })

    it('should error on unsupported types', () => {
        expect(() => jsonToTlJson(Symbol('test'))).toThrow()
    })
})

describe('tlJsonToJson', () => {
    it('should correctly handle null/undefined', () => {
        expect(tlJsonToJson({ _: 'jsonNull' })).toEqual(null)
    })

    it('should correctly handle booleans', () => {
        expect(tlJsonToJson({ _: 'jsonBool', value: true })).toEqual(true)
        expect(tlJsonToJson({ _: 'jsonBool', value: false })).toEqual(false)
    })

    it('should correctly handle numbers', () => {
        expect(tlJsonToJson({ _: 'jsonNumber', value: 123 })).toEqual(123)
        expect(tlJsonToJson({ _: 'jsonNumber', value: 0 })).toEqual(0)
        expect(tlJsonToJson({ _: 'jsonNumber', value: -123 })).toEqual(-123)
    })

    it('should correctly handle strings', () => {
        expect(tlJsonToJson({ _: 'jsonString', value: 'hello' })).toEqual('hello')
        expect(tlJsonToJson({ _: 'jsonString', value: '' })).toEqual('')
    })

    it('should correcly handle arrays', () => {
        expect(
            tlJsonToJson({
                _: 'jsonArray',
                value: [
                    { _: 'jsonNumber', value: 1 },
                    { _: 'jsonNumber', value: 2 },
                    { _: 'jsonNumber', value: 3 },
                ],
            }),
        ).toEqual([1, 2, 3])
    })

    it('should correctly handle objects', () => {
        expect(
            tlJsonToJson({
                _: 'jsonObject',
                value: [
                    { _: 'jsonObjectValue', key: 'a', value: { _: 'jsonNumber', value: 1 } },
                    { _: 'jsonObjectValue', key: 'b', value: { _: 'jsonNumber', value: 2 } },
                ],
            }),
        ).toEqual({ a: 1, b: 2 })
    })
})
