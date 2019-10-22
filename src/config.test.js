const expect = require('unexpected')
const sinon = require('sinon')
const log = require('./index')

describe('src/config', () => {
  beforeEach(() => {
    this.oldLogLevel = process.env.LOG_LEVEL
    process.env.LOG_LEVEL = 'DEBUG'
    sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    this.log = sinon.spy(console, 'log')
    log.config.addPostFormatInterceptor((_level, output) => '<7>' + output)
  })
  afterEach(() => {
    process.env.LOG_LEVEL = this.oldLogLevel
    log.config._postFormatInterceptors.pop()
    sinon.restore()
  })

  it('logs with transformation', () => {
    log.debug('something')
    expect(this.log.callCount, 'to be', 1)
    expect(this.log.args[0], 'to equal', [
      '<7>{"message":"something","severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
})
