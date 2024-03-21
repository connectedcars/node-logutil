// https://github.com/microsoft/TypeScript/issues/1897
export type Json = null | boolean | number | string | Date | { [prop: string]: Json } | Json[]
export type JavaScriptValue =
  | Json
  | Buffer
  | Date
  | undefined
  | JavaScriptValue[]
  | { [prop: string]: JavaScriptValue | undefined }

export function objectToJson(jsValue: JavaScriptValue): Json {
  const seen: JavaScriptValue[] = []
  return _objectToJson(jsValue, seen, 1)
}

function _objectToJson(jsValue: JavaScriptValue, seen: JavaScriptValue[], level: number): Json {
  if (level >= 10) {
    return `(MaxDepth:${JSON.stringify(_objectToJson(jsValue, seen, Number.MIN_SAFE_INTEGER))})`
  }
  if (jsValue === null) {
    return null
  } else {
    const type = typeof jsValue
    if (type === 'boolean') {
      return jsValue as boolean
    }
    if (type === 'number') {
      if (isNaN(jsValue as number)) {
        return '(NaN)'
      }
      if (!isFinite(jsValue as number)) {
        return '(Infinity)'
      }
      return jsValue as number
    }
    if (type === 'string') {
      return (jsValue as string).replace(/\\n/g, '\\n')
    }
    if (type === 'object') {
      if (Array.isArray(jsValue)) {
        seen.push(jsValue)
        if (jsValue.length === 0) {
          return jsValue as Json[]
        }
        const values: Json[] = []
        for (const value of jsValue) {
          if (seen.indexOf(value) > -1) {
            values.push('(Circular:StrippedOut)')
          } else {
            values.push(_objectToJson(value, seen, level + 1))
          }
        }
        return values
      }
      if (jsValue instanceof Date) {
        return `Date(${jsValue.toISOString()})`
      }
      if (Buffer.isBuffer(jsValue)) {
        return `Buffer(${jsValue.toString('hex').toUpperCase()})`
      }
      // Object
      const keys = Object.keys(jsValue as { [key: string]: Json | undefined })
      if (keys.length === 0) {
        return jsValue as { [key: string]: Json }
      }
      seen.push(jsValue)
      const obj: { [key: string]: Json } = {}
      for (const key of keys) {
        const value = (jsValue as { [key: string]: Json | undefined })[key]
        if (typeof value === 'undefined') {
          obj[key] = '(undefined)'
        } else {
          if (seen.indexOf(value) > -1) {
            obj[key] = '(Circular:StrippedOut)'
          } else {
            obj[key] = _objectToJson(value, seen, level + 1)
          }
        }
      }
      return obj
    } else {
      throw new Error(`Unknown JavaScript type: ${type}: ${jsValue}`)
    }
  }
}
