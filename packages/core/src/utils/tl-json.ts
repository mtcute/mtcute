import { tl } from '@mtcute/tl'

/**
 * Convert a JS object to TL JSON
 *
 * @param obj  Object to be converted
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function jsonToTlJson(obj: any): tl.TypeJSONValue {
    if (obj === null || obj === undefined) return { _: 'jsonNull' }
    if (typeof obj === 'boolean') return { _: 'jsonBool', value: obj }
    if (typeof obj === 'number') return { _: 'jsonNumber', value: obj }
    if (typeof obj === 'string') return { _: 'jsonString', value: obj }
    if (Array.isArray(obj))
        return { _: 'jsonArray', value: obj.map(jsonToTlJson) }

    if (typeof obj !== 'object')
        throw new Error(`Unsupported type: ${typeof obj}`)

    const items: tl.TypeJSONObjectValue[] = []

    Object.entries(obj).forEach(([key, value]) => {
        items.push({
            _: 'jsonObjectValue',
            key,
            value: jsonToTlJson(value),
        })
    })

    return {
        _: 'jsonObject',
        value: items,
    }
}

/**
 * Convert TL JSON object to plain JS object
 *
 * @param obj  TL JSON object to convert
 */
export function tlJsonToJson(obj: tl.TypeJSONValue): any {
    switch (obj._) {
        case 'jsonNull':
            return null
        case 'jsonBool':
        case 'jsonNumber':
        case 'jsonString':
            return obj.value
        case 'jsonArray':
            return obj.value.map(tlJsonToJson)
    }

    const ret: any = {}

    obj.value.forEach((item) => {
        ret[item.key] = tlJsonToJson(item.value)
    })

    return ret
}
