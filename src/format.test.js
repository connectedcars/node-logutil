const expect = require('unexpected')
const format = require('./format')

describe('src/format', () => {
  it('formats string message', () => {
    expect(format('something'), 'to be', '{"message":"something"}')
  })
  it('formats number message', () => {
    expect(format(42), 'to be', '{"message":42}')
  })
  it('formats string message with extra params', () => {
    expect(
      format('something', 42, 'foo'),
      'to be',
      '{"message":"something","data":[42,"foo"]}'
    )
  })
  it('formats string message with context param', () => {
    expect(
      format('something', { count: 42, val: 'foo' }),
      'to be',
      '{"message":"something","context":{"count":42,"val":"foo"}}'
    )
  })
  it('formats string message with context and extra params', () => {
    expect(
      format('something', { count: 42, val: 'foo' }, 'foo'),
      'to be',
      '{"message":"something","context":{"count":42,"val":"foo"},"data":["foo"]}'
    )
  })
  it('formats single object', () => {
    expect(
      format({ message: 'something', count: 42, val: 'foo' }),
      'to be',
      '{"message":"something","count":42,"val":"foo"}'
    )
  })
  it('formats single object with extra params', () => {
    expect(
      format({ message: 'something', count: 42, val: 'foo' }, 42, 'foo'),
      'to be',
      '{"message":"something","data":[42,"foo"],"count":42,"val":"foo"}'
    )
  })
  it('formats single object with context param', () => {
    expect(
      format(
        { message: 'something', count: 42, val: 'foo' },
        { count: 21, val: 'bar' }
      ),
      'to be',
      '{"message":"something","context":{"count":21,"val":"bar"},"count":42,"val":"foo"}'
    )
  })
  it('formats single object with context and extra params', () => {
    expect(
      format(
        { message: 'something', count: 42, val: 'foo' },
        { count: 21, val: 'bar' },
        1337,
        'John'
      ),
      'to be',
      '{"message":"something","context":{"count":21,"val":"bar"},"data":[1337,"John"],"count":42,"val":"foo"}'
    )
  })
  it('formats single array', () => {
    expect(
      format(['something', 42]),
      'to be',
      '{"message":"something, 42","data":["something",42]}'
    )
  })
  it('formats single array with extra params', () => {
    expect(
      format(['something', 42], 42, 'foo'),
      'to be',
      '{"message":"something, 42","data":["something",42,42,"foo"]}'
    )
  })
  it('formats single array with context param', () => {
    expect(
      format(['something', 42], { count: 21, val: 'bar' }),
      'to be',
      '{"message":"something, 42","context":{"count":21,"val":"bar"},"data":["something",42]}'
    )
  })
  it('formats single array with context and extra params', () => {
    expect(
      format(['something', 42], { count: 21, val: 'bar' }, 1337, 'John'),
      'to be',
      '{"message":"something, 42","context":{"count":21,"val":"bar"},"data":["something",42,1337,"John"]}'
    )
  })
  it('formats error object', () => {
    expect(
      format(new Error('something')),
      'to match',
      /^\{"message":"something","stack":"Error: something\\n(.+?)"\}$/
    )
  })
  it('formats error object with extra params', () => {
    expect(
      format(new Error('something'), 42, 'foo'),
      'to match',
      /^\{"message":"something","data":\[42,"foo"\],"stack":"Error: something\\n(.+?)"\}$/
    )
  })
  it('formats error object with context param', () => {
    expect(
      format(new Error('something'), { count: 21, val: 'bar' }),
      'to match',
      /^\{"message":"something","context":\{"count":21,"val":"bar"\},"stack":"Error: something\\n(.+?)"\}$/
    )
  })
  it('formats error object with context and extra params', () => {
    expect(
      format(new Error('something'), { count: 21, val: 'bar' }, 1337, 'John'),
      'to match',
      /^\{"message":"something","context":\{"count":21,"val":"bar"\},"data":\[1337,"John"\],"stack":"Error: something\\n(.+?)"\}$/
    )
  })
  it('formats very large message', () => {
    let blob = ''
    for (let i = 0; i < 1024; i++) {
      blob += 'something!'
    }
    let msg = ''
    for (let i = 0; i < 110; i++) {
      msg += blob
    }
    expect(
      format(msg),
      'to match',
      /^\{"message":"Truncated \{\\\"message\\\":\\\"(something!){10200,}somethin"\}$/
    )
    expect(format(msg).length, 'to be less than or equal to', 110 * 1024)
  })
  it('formats not too deep object', () => {
    expect(
      format({
        nested: {
          nested: {
            nested: {
              nested: {
                nested: { nested: { nested: { nested: { nested: 'value' } } } }
              }
            }
          }
        }
      }),
      'to be',
      '{"nested":{"nested":{"nested":{"nested":{"nested":{"nested":{"nested":{"nested":{"nested":"value"}}}}}}}}}'
    )
  })
  it('formats too deep object', () => {
    expect(
      format({
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
      }),
      'to be',
      '{"message":"Depth limited {\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":{\\"nested\\":\\"value\\"}}}}}}}}}}}}"}'
    )
  })
})
