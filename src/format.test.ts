import sinon from 'sinon'

import { format, reachedMaxDepth } from './format'
import { logLevels } from './levels'

describe('src/format', () => {
  beforeEach(() => {
    sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
  })
  afterEach(() => {
    sinon.restore()
  })

  it('formats string message', () => {
    expect(format(logLevels.WARN, 'something')).toEqual(
      '{"message":"something","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats number message', () => {
    expect(format(logLevels.WARN, 42)).toEqual(
      '{"message":"42","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats string message with extra params', () => {
    expect(format(logLevels.WARN, 'something', 42, 'foo')).toEqual(
      '{"message":"something","data":[42,"foo"],"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats string message with context param', () => {
    expect(format(logLevels.WARN, 'something', { count: 42, val: 'foo' })).toEqual(
      '{"message":"something","context":{"count":42,"val":"foo"},"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats string message with context and extra params', () => {
    expect(format(logLevels.WARN, 'something', { count: 42, val: 'foo' }, 'foo')).toEqual(
      '{"message":"something","context":{"count":42,"val":"foo"},"data":["foo"],"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats single object', () => {
    expect(
      format(logLevels.WARN, {
        message: 'something',
        count: 42,
        val: 'foo'
      })
    ).toEqual(
      '{"message":"something","count":42,"val":"foo","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats single object with extra params', () => {
    expect(format(logLevels.WARN, { message: 'something', count: 42, val: 'foo' }, 42, 'foo')).toEqual(
      '{"message":"something","data":[42,"foo"],"count":42,"val":"foo","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats single object with context param', () => {
    expect(format(logLevels.WARN, { message: 'something', count: 42, val: 'foo' }, { count: 21, val: 'bar' })).toEqual(
      '{"message":"something","context":{"count":21,"val":"bar"},"count":42,"val":"foo","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats single object with context and extra params', () => {
    expect(
      format(logLevels.WARN, { message: 'something', count: 42, val: 'foo' }, { count: 21, val: 'bar' }, 1337, 'John')
    ).toEqual(
      '{"message":"something","context":{"count":21,"val":"bar"},"data":[1337,"John"],"count":42,"val":"foo","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats single array', () => {
    expect(format(logLevels.WARN, ['something', 42])).toEqual(
      '{"message":"something, 42","data":["something",42],"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats single array with extra params', () => {
    expect(format(logLevels.WARN, ['something', 42], 42, 'foo')).toEqual(
      '{"message":"something, 42","data":["something",42,42,"foo"],"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats single array with context param', () => {
    expect(format(logLevels.WARN, ['something', 42], { count: 21, val: 'bar' })).toEqual(
      '{"message":"something, 42","context":{"count":21,"val":"bar"},"data":["something",42],"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats single array with context and extra params', () => {
    expect(format(logLevels.WARN, ['something', 42], { count: 21, val: 'bar' }, 1337, 'John')).toEqual(
      '{"message":"something, 42","context":{"count":21,"val":"bar"},"data":["something",42,1337,"John"],"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats error object', () => {
    expect(format(logLevels.WARN, new Error('something'))).toMatch(
      /^\{"message":"something","stack":"Error: something\\n(.+?)","severity":"WARNING","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
  })
  it('formats error object with extra params', () => {
    expect(format(logLevels.WARN, new Error('something'), 42, 'foo')).toMatch(
      /^\{"message":"something","data":\[42,"foo"\],"stack":"Error: something\\n(.+?)","severity":"WARNING","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
  })
  it('formats error object with context param', () => {
    expect(
      format(logLevels.WARN, new Error('something'), {
        count: 21,
        val: 'bar'
      })
    ).toMatch(
      /^\{"message":"something","context":\{"count":21,"val":"bar"\},"stack":"Error: something\\n(.+?)","severity":"WARNING","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
  })
  it('formats error object with context and extra params', () => {
    expect(format(logLevels.WARN, new Error('something'), { count: 21, val: 'bar' }, 1337, 'John')).toMatch(
      /^\{"message":"something","context":\{"count":21,"val":"bar"\},"data":\[1337,"John"\],"stack":"Error: something\\n(.+?)","severity":"WARNING","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
  })
  it('formats context which includes error object', () => {
    expect(
      format(logLevels.WARN, 'something', {
        MyContext: 1,
        e: new Error('some err')
      })
    ).toMatch(
      /^\{"message":"something","context":\{"MyContext":1,"e":\{"stack":"Error: some err\\n(.+?)","message":"some err","__constructorName":"Error"\}\},"severity":"WARNING","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
  })
  it('formats very large message', () => {
    let blob = ''
    for (let i = 0; i < 1024; i++) {
      blob += 'something!'
    }
    let msg = ''
    for (let i = 0; i < 75; i++) {
      msg += blob
    }
    expect(format(logLevels.WARN, msg)).toMatch(
      /^{"message":"Truncated: (something!){3000,}\.{3}","severity":"WARNING","timestamp":"2017-09-01T13:37:42\.000Z"}$/
    )
    expect(format(logLevels.WARN, msg).length).toBeLessThanOrEqual(75 * 1024)
  })
  it('formats very large data', () => {
    let blob = ''
    for (let i = 0; i < 1024; i++) {
      blob += 'something!'
    }
    let data = ''
    for (let i = 0; i < 75; i++) {
      data += blob
    }
    expect(format(logLevels.WARN, 'hello', data)).toMatch(
      /^\{"message":"Truncated \{\\"message\\":\\"hello\\",\\"data\\":\[\\"(something!){3000,}so.*$/
    )
    expect(format(logLevels.WARN, 'hello', data).length).toBeLessThanOrEqual(75 * 1024)
  })
  it('formats not too deep object', () => {
    expect(
      format(logLevels.WARN, {
        nested: {
          nested: {
            nested: {
              nested: {
                nested: { nested: { nested: { nested: { nested: 'value' } } } }
              }
            }
          }
        }
      })
    ).toEqual(
      '{"nested":{"nested":{"nested":{"nested":{"nested":{"nested":{"nested":{"nested":{"nested":"value"}}}}}}}},"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })
  it('formats too deep object', () => {
    expect(
      format(logLevels.WARN, {
        nested: {
          nested: {
            nested: {
              nested: {
                nested: {
                  nested: {
                    nested: {
                      nested: {
                        nested: { nested: { nested: { nested: 'value' } } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
    ).toEqual(
      '{"message":"Depth limited {\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":\\"value\\"}}}}}}}}}}},\\"severity\\":\\"WARNING\\",\\"timestamp\\":\\"2017-09-01T13:37:42.000Z\\"}"}'
    )
  })

  it('formats an object containing a circular reference', () => {
    interface TopLevel {
      normalProperty: string
      circular?: TopLevel
    }
    const topLevel: TopLevel = {
      normalProperty: 'expected value'
    }
    topLevel.circular = topLevel

    expect(format(logLevels.WARN, topLevel)).toEqual(
      '{"normalProperty":"expected value","circular":{"normalProperty":"expected value","circular":"[Circular:StrippedOut]"},"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    )
  })

  it('formats a circular object with too deep nesting', () => {
    interface NestedObj {
      nested: {
        nested: {
          nested: {
            nested: {
              nested: {
                nested: {
                  nested: {
                    nested: {
                      nested: { nested: { nested: { nested: string } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
      circular?: NestedObj
    }
    const nestedObj: NestedObj = {
      nested: {
        nested: {
          nested: {
            nested: {
              nested: {
                nested: {
                  nested: {
                    nested: {
                      nested: { nested: { nested: { nested: 'value' } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    nestedObj.circular = nestedObj
    expect(format(logLevels.WARN, nestedObj)).toEqual(
      '{"message":"Depth limited {\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":\\"value\\"}}}}}}}}}}},\\"circular\\":{\\"nested\\":\\"[Circular:StrippedOut]\\",\\"circular\\":\\"[Circular:StrippedOut]\\"},\\"severity\\":\\"WARNING\\",\\"timestamp\\":\\"2017-09-01T13:37:42.000Z\\"}"}'
    )
  })

  it('formats a circular object with too long a message', () => {
    let blob = ''
    for (let i = 0; i < 1024; i++) {
      blob += 'something!'
    }
    let msg = ''
    for (let i = 0; i < 110; i++) {
      msg += blob
    }
    interface Obj {
      message?: string
      circular?: Obj
    }
    const obj: Obj = {}
    obj.message = msg
    obj.circular = obj

    expect(format(logLevels.WARN, obj)).toMatch(/^.*Truncated.*circular.*$/)
    expect(format(logLevels.WARN, msg).length).toBeLessThanOrEqual(75 * 1024)
  })

  it('still throws unknown errors', () => {
    sinon.stub(JSON, 'stringify').throws()

    expect(() => {
      format(logLevels.WARN, { data: 'fake' })
    }).toThrow()
  })

  it('gets to the bottom of a not too nested object', () => {
    const normalObject = {
      1: {
        2: {
          3: {
            4: {
              5: {
                6: {
                  7: {
                    8: {
                      9: 'not too deep'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    expect(reachedMaxDepth(normalObject)).toEqual(false)
  })

  it('cuts itself of at a certain depth of nested objects', () => {
    const deepObject = {
      1: {
        2: {
          3: {
            4: {
              5: {
                6: {
                  7: {
                    8: {
                      9: {
                        10: {
                          11: {
                            12: {
                              13: {
                                14: {
                                  15: 'too deep'
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
          }
        }
      }
    }
    expect(reachedMaxDepth(deepObject)).toEqual(true)
  })

  it('stores muliline messages as expected', () => {
    const countQuery = `
      SELECT
        ( SELECT COUNT(*) FROM messages
          WHERE (senderId = :userId OR receiverId = :userId) AND workshopId = :workshopId
        ) AS count1,

        ( SELECT COUNT(*) FROM UserActivities
          WHERE (userId = :userId) ''}
        ) AS count2
    `
    const expectedLogOutput = `{"message":"\\n      SELECT\\n        ( SELECT COUNT(*) FROM messages\\n          WHERE (senderId = :userId OR receiverId = :userId) AND workshopId = :workshopId\\n        ) AS count1,\\n\\n        ( SELECT COUNT(*) FROM UserActivities\\n          WHERE (userId = :userId) ''}\\n        ) AS count2\\n    ","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}`

    expect(format(logLevels.WARN, countQuery)).toEqual(expectedLogOutput)
  })
})
