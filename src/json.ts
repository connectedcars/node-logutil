// https://github.com/microsoft/TypeScript/issues/1897
export type Json = null | boolean | number | string | { [prop: string]: Json } | Json[]
export type JavaScriptValue =
  | Json
  | bigint
  | Buffer
  | Date
  | undefined
  | JavaScriptValue[]
  | { [prop: string]: JavaScriptValue | undefined }
  | Error
  | Map<JavaScriptValue, JavaScriptValue>
  | Set<JavaScriptValue>
  | WeakMap<object, JavaScriptValue>
  | WeakSet<object>
  | RegExp
  | { new (...args: JavaScriptValue[]): JavaScriptValue }
  | ((...args: JavaScriptValue[]) => JavaScriptValue)

export function objectToJson(
  jsValue: JavaScriptValue,
  options: Partial<ObjectToJsonOptions> & { maxDepth?: number } = {}
): Json {
  const seen: JavaScriptValue[] = []
  const maxStringLength =
    options.maxStringLength !== undefined
      ? options.maxStringLength
      : process.env.JSON_MAX_STRING_LENGTH !== undefined
      ? parseInt(process.env.JSON_MAX_STRING_LENGTH)
      : 100
  const maxArrayLength =
    options.maxArrayLength !== undefined
      ? options.maxArrayLength
      : process.env.JSON_MAX_ARRAY_LENGTH !== undefined
      ? parseInt(process.env.JSON_MAX_ARRAY_LENGTH)
      : 10
  const maxObjectSize =
    options.maxObjectSize !== undefined
      ? options.maxObjectSize
      : process.env.JSON_MAX_OBJECT_SIZE !== undefined
      ? parseInt(process.env.JSON_MAX_OBJECT_SIZE)
      : 10
  const maxDepth =
    options.maxDepth !== undefined
      ? options.maxDepth
      : process.env.JSON_MAX_DEPTH !== undefined
      ? parseInt(process.env.JSON_MAX_DEPTH)
      : 10
  return _objectToJson(jsValue, seen, maxDepth, { maxStringLength, maxArrayLength, maxObjectSize })
}

interface ObjectToJsonOptions {
  maxStringLength: number
  maxArrayLength: number
  maxObjectSize: number
}

function _objectToJson(
  jsValue: JavaScriptValue,
  seen: JavaScriptValue[],
  maxDepth: number,
  options: ObjectToJsonOptions
): Json {
  if (maxDepth <= 0) {
    return `(MaxDepth:strippedOut:${typeof jsValue})`
  }
  if (jsValue === null) {
    return null
  }
  if (jsValue === undefined) {
    return '(undefined)'
  }

  switch (typeof jsValue) {
    case 'boolean':
      return jsValue
    case 'number': {
      if (isNaN(jsValue)) {
        return '(NaN)'
      }
      if (!isFinite(jsValue)) {
        return '(Infinity)'
      }
      return jsValue
    }
    case 'bigint':
      return `BigInt(${jsValue?.toString()})`
    case 'string':
      return (
        jsValue.replace(/\n/g, '\\n').substring(0, options.maxStringLength) +
        (jsValue.length > options.maxStringLength ? '...(truncated)' : '')
      )
    case 'object': {
      seen.push(jsValue)
      if (Array.isArray(jsValue)) {
        if (jsValue.length === 0) {
          return jsValue as Json[]
        }
        const values: Json[] = []
        for (const value of jsValue) {
          if (seen.includes(value)) {
            values.push('(Circular:StrippedOut)')
          } else {
            if (values.length >= options.maxArrayLength) {
              values.push('truncated...')
              break
            }
            values.push(_objectToJson(value, seen, maxDepth - 1, options))
          }
        }
        return values
      } else if (jsValue instanceof Date) {
        return `Date(${jsValue.toISOString()})`
      } else if (Buffer.isBuffer(jsValue)) {
        return `Buffer(${jsValue.toString('hex').toUpperCase()})`
      } else if (jsValue instanceof Error) {
        const stack = typeof jsValue.stack === 'string' ? parseStack(jsValue.stack, jsValue.constructor.name) : []

        let cause = {}
        const _cause = jsValue.cause
        if ('cause' in jsValue && _cause !== undefined && isJavaScriptValue(_cause)) {
          seen.push(jsValue)
          if (seen.includes(_cause)) {
            cause = { cause: '(Circular:StrippedOut)' }
          } else {
            cause = { cause: _objectToJson(_cause, seen, maxDepth - 1, options) }
          }
        }
        let context = {}
        if ('context' in jsValue) {
          const _context = jsValue.context
          if (_context !== undefined && isJavaScriptValue(_context)) {
            context = { context: _objectToJson(_context, seen, maxDepth - 1, options) }
          }
        }
        return { __errorType: jsValue.constructor.name, message: jsValue.message, stack, ...cause, ...context }
      } else if (jsValue instanceof Map) {
        const obj: { [key: string]: Json } = {}
        for (const [key, value] of jsValue.entries()) {
          const jsonKey = _objectToJson(key, seen, maxDepth - 1, options)
          const stringKey = typeof jsonKey === 'string' ? jsonKey : JSON.stringify(jsonKey)
          obj[stringKey] = _objectToJson(value, seen, maxDepth - 1, options)
        }
        return obj
      } else if (jsValue instanceof Set) {
        const arr: Json[] = []
        seen.push(jsValue)
        for (const value of jsValue.values()) {
          arr.push(_objectToJson(value, seen, maxDepth - 1, options))
        }
        return arr
      } else if (jsValue instanceof WeakMap || jsValue instanceof WeakSet) {
        return '(WeakCollection:strippedOut)'
      } else if (jsValue instanceof RegExp) {
        return `RegExp(${jsValue.source})`
      } else {
        const keys = Object.keys(jsValue)
        if (keys.length === 0) {
          return jsValue as { [key: string]: Json }
        }
        const obj: { [key: string]: Json } = {}
        for (const key of keys.slice(0, options.maxObjectSize)) {
          const value = jsValue[key]
          if (typeof value === 'undefined') {
            obj[key] = '(undefined)'
          } else {
            if (seen.includes(value)) {
              obj[key] = '(Circular:StrippedOut)'
            } else {
              obj[key] = _objectToJson(value, seen, maxDepth - 1, options)
            }
          }
        }
        if (keys.length > options.maxObjectSize) {
          obj['truncated...'] = true
        }
        return obj
      }
    }
    case 'function':
      return jsValue.toString()
  }
  /* istanbul ignore next */
  return assertUnreachable(jsValue, 'Unknown JavaScript type')
}

/* istanbul ignore next */
function assertUnreachable(x: never, message: string): never {
  throw new Error(`${message}: ${JSON.stringify(x)} type: ${typeof x}`)
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
