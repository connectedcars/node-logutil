const expect = require('unexpected')
const sinon = require('sinon')
const log = require('./index')

describe('src/error', () => {
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
    log.error('something')
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 1)
    expect(this.error.args[0], 'to equal', [
      '{"message":"something","severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs empty argument', () => {
    log.error()
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 1)
    expect(this.error.args[0], 'to equal', ['{"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'])
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'INFO'
    log.error('something', 42, { foo: 'bar' })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 1)
    expect(this.error.args[0], 'to equal', [
      '{"message":"something","data":[42,{"foo":"bar"}],"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    log.error('something')
    log.error('something else', 42)
    log.error({ foo: true })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 3)
    expect(this.error.args[0], 'to equal', [
      '{"message":"something","severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.error.args[1], 'to equal', [
      '{"message":"something else","data":[42],"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.error.args[2], 'to equal', ['{"foo":true,"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'])
  })

  it('logs single argument via promise', async () => {
    process.env.LOG_LEVEL = 'WARN'
    const stub = sinon.stub()
    await log.error(() => {
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
      '{"message":"something","severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs single argument via function', async () => {
    await log.error(() => {
      return 'something'
    })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 1)
    expect(this.error.args[0], 'to equal', [
      '{"message":"something","severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs single argument via failing promise', async () => {
    await log.error(() => {
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
      /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","severity":"ERROR","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
  })
  it('logs single argument via exceptional function', async () => {
    await log.error(() => {
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
      /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","severity":"ERROR","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
  })
})
