/* eslint-disable no-console */
import { JavaScriptValue, objectToJson } from './json'

describe('src/json', () => {
  const sample: any = {
    string: 'string',
    int: 1,
    float: 1.1,
    null: null,
    nan: NaN,
    undefined: undefined,
    date: new Date('2021-01-09T18:11:34.309Z'),
    false: false,
    true: true,
    infinity: 1000 / 0,
    intArray: [1, 2, 3, 4],
    object: {
      stringKey: 'string',
      intKey: 1
    },
    multiLineString: 'hello\nhello',
    emptyArray: [],
    buffer: Buffer.from('DEADBEEF', 'hex'),
    bigInt: 1n,
    deep: {
      deep: {
        deep: {
          deep: {
            deep: {
              deep: {
                deep: {
                  deep: {
                    deep: {
                      deep: {
                        deep: {}
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  sample.mySelf = sample

  it('should generate JSON where all exceptions are handled', () => {
    const output = objectToJson(sample, { maxObjectSize: 50 })
    expect(output).toMatchSnapshot()

    // Try to convert to JSON and make sure nothing is lost
    const json = JSON.stringify(output, null, 2)
    const sample2 = JSON.parse(json)
    expect(sample2).toEqual(output)
  })

  it('should handle class', () => {
    const output = objectToJson(new SomeTestClass() as unknown as JavaScriptValue)
    expect(output).toEqual({
      __constructorName: 'SomeTestClass',
      someProperty: 'someProperty',
      someField: 'someField'
    })
  })

  describe('Error', () => {
    class HalClientError extends Error {
      public constructor(message?: string) {
        super(message)
        this.name = this.constructor.name
      }
    }
    class ParserError extends HalClientError {}

    it('should handle Error', () => {
      const output = objectToJson(new Error('test error')) as unknown as ErrorJson
      expect(output.message).toBe('test error')
      expect(output.__constructorName).toBe('Error')
      expect(Array.isArray(output.stack)).toBe(true)
      expect(output.stack.length).toBeGreaterThan(0)
      expect(output.cause).toBeUndefined()
    })

    it('should handle custom error', () => {
      const output = objectToJson(new HalClientError('test error')) as unknown as ErrorJson
      expect(output.message).toBe('test error')
      expect(output.__constructorName).toBe('HalClientError')
      expect(Array.isArray(output.stack)).toBe(true)
      expect(output.stack.length).toBeGreaterThan(0)
      expect(output.cause).toBeUndefined()
    })

    it('should handle Error with cause', () => {
      const output = objectToJson(new Error('test error', { cause: new Error('cause Error') })) as unknown as ErrorJson
      expect(output.message).toBe('test error')
      expect(output.__constructorName).toBe('Error')
      expect(Array.isArray(output.stack)).toBe(true)
      expect(output.stack.length).toBeGreaterThan(0)
      expect(output.cause).toBeDefined()
      expect(output.cause?.message).toBe('cause Error')
      expect(output.cause?.__constructorName).toBe('Error')
      expect(Array.isArray(output.cause?.stack)).toBe(true)
      expect(output.cause?.stack.length).toBeGreaterThan(0)
    })

    it('should handle Error with custom cause', () => {
      const output = objectToJson(
        new Error('test error', { cause: new ParserError('cause Error') })
      ) as unknown as ErrorJson

      expect(output.message).toBe('test error')
      expect(output.__constructorName).toBe('Error')
      expect(Array.isArray(output.stack)).toBe(true)
      expect(output.stack.length).toBeGreaterThan(0)
      expect(output.cause).toBeDefined()
      expect(output.cause?.message).toBe('cause Error')
      expect(output.cause?.__constructorName).toBe('ParserError')
      expect(Array.isArray(output.cause?.stack)).toBe(true)
      expect(output.cause?.stack.length).toBeGreaterThan(0)
    })

    it('should handle Error with complex cause', () => {
      const output = objectToJson(
        new Error('test error', { cause: { ...sample, error: new ParserError('cause Error') } }),
        { maxObjectSize: 50 }
      ) as unknown as ErrorCauseJson

      expect(output.message).toBe('test error')
      expect(output.__constructorName).toBe('Error')
      expect(Array.isArray(output.stack)).toBe(true)
      expect(output.stack.length).toBeGreaterThan(0)
      expect(output.cause).toBeDefined()
      expect(output.cause?.error?.message).toBe('cause Error')
      expect(output.cause?.error?.__constructorName).toBe('ParserError')
      expect(Array.isArray(output.cause?.error?.stack)).toBe(true)
      expect(output.cause?.error?.stack.length).toBeGreaterThan(0)
    })

    it('should handle Error with circular cause', () => {
      const error = new Error('test error')
      error['cause'] = error
      const output = objectToJson(error) as unknown as ErrorJson

      expect(output.message).toBe('test error')
      expect(output.__constructorName).toBe('Error')
      expect(Array.isArray(output.stack)).toBe(true)
      expect(output.stack.length).toBeGreaterThan(0)
      expect(output.cause).toBeDefined()
      expect(output.cause).toBe('(Circular:StrippedOut)')
    })

    it('handles Error with context', () => {
      const output = objectToJson(
        new ErrorWithContext('test error', {
          cause: new ErrorWithContext('cause Error', { context: { causeContext: 'test' } }),
          context: { foo: 'bar' }
        })
      ) as unknown as ContextErrorJson

      expect(output.message).toBe('test error')
      expect(output.__constructorName).toBe('ErrorWithContext')
      expect(Array.isArray(output.stack)).toBe(true)
      expect(output.stack.length).toBeGreaterThan(0)
      expect(output.context).toEqual({ foo: 'bar' })
      expect(output.cause).toBeDefined()
      expect(output.cause?.message).toBe('cause Error')
      expect(output.cause?.__constructorName).toBe('ErrorWithContext')
      expect(Array.isArray(output.cause?.stack)).toBe(true)
      expect(output.cause?.stack.length).toBeGreaterThan(0)
    })

    it('should handle Error with circular context', () => {
      const error = new ErrorWithContext('test error')
      error.context = { error }
      const output = objectToJson(error) as unknown as ContextErrorJson

      expect(output.message).toBe('test error')
      expect(output.__constructorName).toBe('ErrorWithContext')
      expect(Array.isArray(output.stack)).toBe(true)
      expect(output.stack.length).toBeGreaterThan(0)
      expect(output.context).toEqual({ error: '(Circular:StrippedOut)' })
    })

    it('should handle Error with undefined context', () => {
      const error = new ErrorWithContext('test error')
      error.context = undefined
      const output = objectToJson(error) as unknown as ContextErrorJson

      expect(output.message).toBe('test error')
      expect(output.__constructorName).toBe('ErrorWithContext')
      expect(Array.isArray(output.stack)).toBe(true)
      expect(output.stack.length).toBeGreaterThan(0)
      expect(output.context).toBeUndefined()
    })

    it('should handle Error with malformed stack', () => {
      const error = new Error('test error')
      error.stack = 'at foo\nat'
      const output = objectToJson(error) as unknown as ErrorJson

      expect(output.message).toBe('test error')
      expect(output.__constructorName).toBe('Error')
      expect(Array.isArray(output.stack)).toBe(false)
      expect(output.stack).toBe('at foo\nat')
    })

    it('should handle Error with malformed stack at line', () => {
      const error = new Error('test error')
      error.stack = 'Error: \nfoo'
      const output = objectToJson(error) as unknown as ErrorJson

      expect(output.message).toBe('test error')
      expect(output.__constructorName).toBe('Error')
      expect(Array.isArray(output.stack)).toBe(false)
      expect(output.stack).toBe('Error: \nfoo')
    })
  })

  describe('weird cases', () => {
    it('should handle Map', () => {
      const map = new Map()
      map.set('foo', 'bar')
      map.set({ k: 'v' }, () => console.log('hello'))
      map.set(new RegExp('test'), undefined)

      const output = objectToJson(map)
      expect(output).toEqual({ foo: 'bar', '{"k":"v"}': "() => console.log('hello')", 'RegExp(test)': '(undefined)' })
    })

    it('should handle Set', () => {
      const set = new Set()
      set.add('foo')
      set.add(() => console.log('hello'))
      set.add(new RegExp(/\w[test]+/))
      const output = objectToJson(set)
      expect(output).toEqual(['foo', "() => console.log('hello')", 'RegExp(\\w[test]+)'])
    })

    it('should handle weakmap', () => {
      const weakMap = new WeakMap()
      const key = {}
      weakMap.set(key, 'value')
      const output = objectToJson(weakMap)
      expect(output).toEqual('(WeakCollection:strippedOut)')
    })

    it('should handle weakset', () => {
      const weakSet = new WeakSet()
      const key = {}
      weakSet.add(key)
      const output = objectToJson(weakSet)
      expect(output).toEqual('(WeakCollection:strippedOut)')
    })

    it('should handle very long string', () => {
      const longString = 'a'.repeat(1000)
      const output = objectToJson(longString)
      expect(output).toBe('a'.repeat(100) + '...(truncated)')
    })

    it('should handle circular reference in array', () => {
      const arr: any[] = []
      arr.push(arr)
      const output = objectToJson(arr)
      expect(output).toEqual(['(Circular:StrippedOut)'])
    })

    it('should handle too long array', () => {
      const arr = new Array(1000).fill(0)
      const output = objectToJson(arr)
      expect(output).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'truncated...'])
    })

    it('should handle empty object', () => {
      const output = objectToJson({})
      expect(output).toEqual({})
    })

    it('should handle too long object', () => {
      const obj: any = {}
      for (let i = 0; i < 1000; i++) {
        obj[i] = i
      }
      const output = objectToJson(obj)
      expect(output).toEqual({ ...Object.fromEntries(Object.entries(obj).slice(0, 10)), 'truncated...': true })
    })
  })
})

interface ErrorJson {
  __constructorName: string
  message: string
  stack: string[]
  cause?: ErrorJson
}

interface ErrorCauseJson {
  __constructorName: string
  message: string
  stack: string[]
  cause?: { error: ErrorJson }
}
interface ContextErrorJson {
  __constructorName: string
  message: string
  stack: string[]
  context: { [key: string]: unknown }
  cause?: ContextErrorJson
}

interface ErrorContext {
  context?: Record<string, unknown>
}

export class ErrorWithContext extends Error {
  public context?: Record<string, unknown>

  public constructor(message: string, options?: ErrorOptions & ErrorContext) {
    super(message, options)
    this.name = this.constructor.name
    this.context = options?.context
  }
}

class SomeTestClass {
  public someProperty = 'someProperty'
  private someField = 'someField'
  public someMethod() {
    return 'someMethod'
  }
}
