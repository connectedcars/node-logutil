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
    const sample2 = JSON.parse(JSON.stringify(output))
    expect(sample2).toEqual(output)
  })
})
