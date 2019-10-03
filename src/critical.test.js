const expect = require('unexpected')
const sinon = require('sinon')
const log = require('./index')

describe('src/critical', () => {
  beforeEach(() => {
    this.oldLogLevel = process.env.LOG_LEVEL
    delete process.env.LOG_LEVEL
    sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    this.log = sinon.spy(console, 'log')
    this.warn = sinon.spy(console, 'warn')
    this.error = sinon.stub(console, 'error')
  })
  afterEach(() => {
    process.env.LOG_LEVEL = this.oldLogLevel
    sinon.restore()
  })

  it('logs single argument', () => {
    log.critical('something')
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 1)
    expect(this.error.args[0], 'to equal', [
      '{"message":"something","severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs empty argument', () => {
    log.critical()
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 1)
    expect(this.error.args[0], 'to equal', ['{"severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'])
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'INFO'
    log.critical('something', 42, { foo: 'bar' })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 1)
    expect(this.error.args[0], 'to equal', [
      '{"message":"something","data":[42,{"foo":"bar"}],"severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    log.critical('something')
    log.critical('something else', 42)
    log.critical({ foo: true })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 3)
    expect(this.error.args[0], 'to equal', [
      '{"message":"something","severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.error.args[1], 'to equal', [
      '{"message":"something else","data":[42],"severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.error.args[2], 'to equal', [
      '{"foo":true,"severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })

  it('logs single argument via promise', async () => {
    process.env.LOG_LEVEL = 'WARN'
    const stub = sinon.stub()
    await log.critical(() => {
      return new Promise(resolve => {
        stub()
        resolve('something')
      })
    })
    expect(stub.callCount, 'to be', 1)
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 1)
    expect(this.error.args[0], 'to equal', [
      '{"message":"something","severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs single argument via function', async () => {
    await log.critical(() => {
      return 'something'
    })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 1)
    expect(this.error.args[0], 'to equal', [
      '{"message":"something","severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs single argument via failing promise', async () => {
    await log.critical(() => {
      return new Promise((resolve, reject) => {
        reject(new Error('wrah'))
      })
    })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 1)
    expect(this.error.args[0], 'to have length', 1)
    expect(
      this.error.args[0][0],
      'to match',
      /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","severity":"CRITICAL","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
  })
  it('logs single argument via exceptional function', async () => {
    await log.critical(() => {
      throw new Error('wrah')
      return new Promise(resolve => {
        resolve('something')
      })
    })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 1)
    expect(this.error.args[0], 'to have length', 1)
    expect(
      this.error.args[0][0],
      'to match',
      /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","severity":"CRITICAL","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
  })
})
