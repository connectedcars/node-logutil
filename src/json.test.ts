import { objectToJson } from './json'

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
    const output = objectToJson(sample)
    expect(output).toMatchSnapshot()

    // Try to convert to JSON and make sure nothing is lost
    const json = JSON.stringify(output, null, 2)
    const sample2 = JSON.parse(json)
    expect(sample2).toEqual(output)
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
      const output = objectToJson(new Error('test error'))
      expect(output).toMatchSnapshot()
    })

    it('should handle custom error', () => {
      const output = objectToJson(new HalClientError('test error'))
      expect(output).toMatchSnapshot()
    })

    it('should handle Error with cause', () => {
      const output = objectToJson(new Error('test error', { cause: new Error('cause Error') }))
      expect(output).toMatchSnapshot()
    })

    it('should handle Error with custom cause', () => {
      const output = objectToJson(new Error('test error', { cause: new ParserError('cause Error') }))
      expect(output).toMatchSnapshot()
    })

    it('should handle Error with complex cause', () => {
      const output = objectToJson(
        new Error('test error', { cause: { ...sample, error: new ParserError('cause Error') } })
      )
      expect(output).toMatchSnapshot()
    })

    it('should handle Error with circular cause', () => {
      const error = new Error('test error')
      const cause = { cause: error }
      error['cause'] = cause
      const output = objectToJson(error)
      expect(output).toMatchSnapshot()
    })
  })
})
