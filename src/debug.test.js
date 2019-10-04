const expect = require('unexpected')
const sinon = require('sinon')
const log = require('./index')

describe('src/debug', () => {
  beforeEach(() => {
    this.oldLogLevel = process.env.LOG_LEVEL
    delete process.env.LOG_LEVEL
    sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    this.warn = sinon.spy(console, 'warn')
    this.error = sinon.spy(console, 'error')
  })
  afterEach(() => {
    process.env.LOG_LEVEL = this.oldLogLevel
    sinon.restore()
  })

  it('logs nothing', () => {
    const info = sinon.stub(console, 'log')
    log.debug('something')
    expect(info.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs single argument', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    const info = sinon.stub(console, 'log')
    log.debug('something')
    expect(info.callCount, 'to be', 1)
    expect(info.args[0], 'to equal', [
      '{"message":"something","severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs empty argument', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    const info = sinon.stub(console, 'log')
    log.debug()
    expect(info.callCount, 'to be', 1)
    expect(info.args[0], 'to equal', ['{"severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'])
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'debug'
    const info = sinon.stub(console, 'log')
    log.debug('something', 42, { foo: 'bar' })
    expect(info.callCount, 'to be', 1)
    expect(info.args[0], 'to equal', [
      '{"message":"something","data":[42,{"foo":"bar"}],"severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    const info = sinon.stub(console, 'log')
    log.debug('something')
    log.debug('something else', 42)
    log.debug({ foo: true })
    expect(info.callCount, 'to be', 3)
    expect(info.args[0], 'to equal', [
      '{"message":"something","severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(info.args[1], 'to equal', [
      '{"message":"something else","data":[42],"severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(info.args[2], 'to equal', ['{"foo":true,"severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'])
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
  })

  it('logs nothing via promise', async () => {
    const info = sinon.stub(console, 'log')
    const stub = sinon.stub()
    await log.debug(() => {
      return new Promise(resolve => {
        stub()
        resolve('something')
      })
    })
    expect(stub.callCount, 'to be', 0)
    expect(info.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
    info.restore()
  })
  it('logs single argument via promise', async () => {
    process.env.LOG_LEVEL = 'DEBUG'
    const info = sinon.stub(console, 'log')
    const stub = sinon.stub()
    await log.debug(() => {
      return new Promise(resolve => {
        stub()
        resolve('something')
      })
    })
    expect(stub.callCount, 'to be', 1)
    expect(info.callCount, 'to be', 1)
    expect(info.args[0], 'to equal', [
      '{"message":"something","severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs single argument via function', async () => {
    process.env.LOG_LEVEL = 'DEBUG'
    const info = sinon.stub(console, 'log')
    await log.debug(() => {
      return 'something'
    })
    expect(info.callCount, 'to be', 1)
    expect(info.args[0], 'to equal', [
      '{"message":"something","severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs single argument via failing promise', async () => {
    process.env.LOG_LEVEL = 'DEBUG'
    const info = sinon.stub(console, 'log')
    await log.debug(() => {
      return new Promise((resolve, reject) => {
        reject(new Error('wrah'))
      })
    })
    expect(info.callCount, 'to be', 1)
    expect(info.args[0], 'to have length', 1)
    expect(
      info.args[0][0],
      'to match',
      /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","severity":"DEBUG","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs single argument via exceptional function', async () => {
    process.env.LOG_LEVEL = 'DEBUG'
    const info = sinon.stub(console, 'log')
    await log.debug(() => {
      throw new Error('wrah')
      return new Promise(resolve => {
        resolve('something')
      })
    })
    expect(info.callCount, 'to be', 1)
    expect(info.args[0], 'to have length', 1)
    expect(
      info.args[0][0],
      'to match',
      /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","severity":"DEBUG","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
  })
})
