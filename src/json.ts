// https://github.com/microsoft/TypeScript/issues/1897
export type Json = null | boolean | number | string | { [prop: string]: Json } | Json[]
export type JavaScriptValue =
  | Json
  | Buffer
  | Date
  | undefined
  | JavaScriptValue[]
  | { [prop: string]: JavaScriptValue | undefined }
  | Error

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
  }
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
  if (type === 'bigint') {
    return `BigInt(${jsValue?.toString()})`
  }
  if (type === 'string') {
    return (jsValue as string).replace(/\n/g, '\\n')
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
    if (jsValue instanceof Error) {
      const stack = typeof jsValue.stack === 'string' ? parseStack(jsValue.stack, jsValue.constructor.name) : []

      let cause = {}
      const _cause = jsValue.cause
      if ('cause' in jsValue && _cause !== undefined && isJavaScriptValue(_cause)) {
        seen.push(jsValue)
        cause = { cause: _objectToJson(_cause, seen, level + 1) }
      }
      return { type: jsValue.constructor.name, message: jsValue.message, stack, ...cause }
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

// Parse a node stack trace to an array of strings,
// fallback to the original stack if the format is unknown
function parseStack(stack: string, className: string, maxDepth = 5): string | string[] {
  if (!stack.startsWith(`${className}: `)) {
    return stack
  }
  const stackLines = []
  for (const line of stack.split('\n')) {
    if (line.startsWith('    at ')) {
      stackLines.push(line.substring(7))
    } else if (line.startsWith(`${className}: `)) {
      // skip
    } else {
      return stack
    }
  }
  return stackLines.slice(0, maxDepth)
}

function isJavaScriptValue(x: unknown): x is JavaScriptValue {
  if (x === null || x === undefined) {
    return true
  }
  const types = ['boolean', 'number', 'bigint', 'string', 'object']
  if (types.includes(typeof x)) {
    return true
  }
  return false
}
