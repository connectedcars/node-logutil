const expect = require('unexpected')
const sinon = require('sinon')
const log = require('./index')

describe('src/error', () => {
  beforeEach(() => {
    this.oldLogLevel = process.env.LOG_LEVEL
    delete process.env.LOG_LEVEL
    this.clock = sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    sinon.spy(console, 'log')
    sinon.spy(console, 'warn')
    sinon.stub(console, 'error')
  })
  afterEach(() => {
    process.env.LOG_LEVEL = this.oldLogLevel
    this.clock.restore()
    console.log.restore()
    console.warn.restore()
    console.error.restore()
  })

  it('logs single argument', () => {
    log.error('something')
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 1)
    expect(console.error.args[0], 'to equal', [
      '{"message":"something","severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs empty argument', () => {
    log.error()
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 1)
    expect(console.error.args[0], 'to equal', [
      '{"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'INFO'
    log.error('something', 42, { foo: 'bar' })
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 1)
    expect(console.error.args[0], 'to equal', [
      '{"message":"something","data":[42,{"foo":"bar"}],"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    log.error('something')
    log.error('something else', 42)
    log.error({ foo: true })
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 3)
    expect(console.error.args[0], 'to equal', [
      '{"message":"something","severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(console.error.args[1], 'to equal', [
      '{"message":"something else","data":[42],"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(console.error.args[2], 'to equal', [
      '{"foo":true,"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })

  it('logs single argument via promise', done => {
    process.env.LOG_LEVEL = 'WARN'
    const stub = sinon.stub()
    log
      .error(() => {
        return new Promise(resolve => {
          stub()
          resolve('something')
        })
      })
      .then(() => {
        expect(stub.callCount, 'to be', 1)
        expect(console.log.callCount, 'to be', 0)
        expect(console.warn.callCount, 'to be', 0)
        expect(console.error.callCount, 'to be', 1)
        expect(console.error.args[0], 'to equal', [
          '{"message":"something","severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
        ])
        done()
      })
  })
  it('logs single argument via function', done => {
    log
      .error(() => {
        return 'something'
      })
      .then(() => {
        expect(console.log.callCount, 'to be', 0)
        expect(console.warn.callCount, 'to be', 0)
        expect(console.error.callCount, 'to be', 1)
        expect(console.error.args[0], 'to equal', [
          '{"message":"something","severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
        ])
        done()
      })
  })
  it('logs single argument via failing promise', done => {
    log
      .error(() => {
        return new Promise((resolve, reject) => {
          reject(new Error('wrah'))
        })
      })
      .then(() => {
        expect(console.log.callCount, 'to be', 0)
        expect(console.warn.callCount, 'to be', 0)
        expect(console.error.callCount, 'to be', 1)
        expect(console.error.args[0], 'to have length', 1)
        expect(
          console.error.args[0][0],
          'to match',
          /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","severity":"ERROR","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
        )
        done()
      })
  })
  it('logs single argument via exceptional function', done => {
    log
      .error(() => {
        throw new Error('wrah')
        return new Promise(resolve => {
          resolve('something')
        })
      })
      .then(() => {
        expect(console.log.callCount, 'to be', 0)
        expect(console.warn.callCount, 'to be', 0)
        expect(console.error.callCount, 'to be', 1)
        expect(console.error.args[0], 'to have length', 1)
        expect(
          console.error.args[0][0],
          'to match',
          /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","severity":"ERROR","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
        )
        done()
      })
  })
})
