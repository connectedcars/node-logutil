const expect = require('unexpected')
const sinon = require('sinon')
const log = require('./index')

describe('src/warn', () => {
  beforeEach(() => {
    this.oldLogLevel = process.env.LOG_LEVEL
    delete process.env.LOG_LEVEL
    sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    this.log = sinon.spy(console, 'log')
    this.warn = sinon.stub(console, 'warn')
    this.error = sinon.spy(console, 'error')
  })
  afterEach(() => {
    process.env.LOG_LEVEL = this.oldLogLevel
    sinon.restore()
  })

  it('logs nothing', () => {
    process.env.LOG_LEVEL = 'ERROR'
    log.warn('something')
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs single argument', () => {
    log.warn('something')
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 1)
    expect(this.warn.args[0], 'to equal', [
      '{"message":"something","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs empty argument', () => {
    log.warn()
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 1)
    expect(this.warn.args[0], 'to equal', ['{"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'])
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'INFO'
    log.warn('something', 42, { foo: 'bar' })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 1)
    expect(this.warn.args[0], 'to equal', [
      '{"message":"something","data":[42,{"foo":"bar"}],"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    log.warn('something')
    log.warn('something else', 42)
    log.warn({ foo: true })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 3)
    expect(this.warn.args[0], 'to equal', [
      '{"message":"something","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.warn.args[1], 'to equal', [
      '{"message":"something else","data":[42],"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.warn.args[2], 'to equal', ['{"foo":true,"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'])
    expect(this.error.callCount, 'to be', 0)
  })

  it('logs nothing via promise', async () => {
    process.env.LOG_LEVEL = 'ERROR'
    const stub = sinon.stub()
    await log.warn(() => {
      return new Promise(resolve => {
        stub()
        resolve('something')
      })
    })
    expect(stub.callCount, 'to be', 0)
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 0)
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs single argument via promise', async () => {
    process.env.LOG_LEVEL = 'WARN'
    const stub = sinon.stub()
    await log.warn(() => {
      return new Promise(resolve => {
        stub()
        resolve('something')
      })
    })
    expect(stub.callCount, 'to be', 1)
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 1)
    expect(this.warn.args[0], 'to equal', [
      '{"message":"something","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs single argument via function', async () => {
    await log.warn(() => {
      return 'something'
    })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 1)
    expect(this.warn.args[0], 'to equal', [
      '{"message":"something","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs single argument via failing promise', async () => {
    await log.warn(() => {
      return new Promise((resolve, reject) => {
        reject(new Error('wrah'))
      })
    })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 1)
    expect(this.warn.args[0], 'to have length', 1)
    expect(
      this.warn.args[0][0],
      'to match',
      /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","severity":"WARNING","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
    expect(this.error.callCount, 'to be', 0)
  })
  it('logs single argument via exceptional function', async () => {
    await log.warn(() => {
      throw new Error('wrah')
      return new Promise(resolve => {
        resolve('something')
      })
    })
    expect(this.log.callCount, 'to be', 0)
    expect(this.warn.callCount, 'to be', 1)
    expect(this.warn.args[0], 'to have length', 1)
    expect(
      this.warn.args[0][0],
      'to match',
      /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","severity":"WARNING","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
    )
    expect(this.error.callCount, 'to be', 0)
  })
})
