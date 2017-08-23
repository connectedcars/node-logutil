const expect = require('unexpected')
const sinon = require('sinon')
const log = require('./index')

describe('src/error', () => {
  beforeEach(() => {
    this.oldLogLevel = process.env.LOG_LEVEL
    delete process.env.LOG_LEVEL
    sinon.spy(console, 'log')
    sinon.stub(console, 'warn')
    sinon.spy(console, 'error')
  })
  afterEach(() => {
    process.env.LOG_LEVEL = this.oldLogLevel
    console.log.restore()
    console.warn.restore()
    console.error.restore()
  })

  it('logs single argument', () => {
    log.error('something')
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 1)
    expect(console.error.args[0], 'to equal', ['{"message":"something"}'])
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'INFO'
    log.error('something', 42, { foo: 'bar' })
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 1)
    expect(console.error.args[0], 'to equal', [
      '{"message":"something","data":[42,{"foo":"bar"}]}'
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
    expect(console.error.args[0], 'to equal', ['{"message":"something"}'])
    expect(console.error.args[1], 'to equal', [
      '{"message":"something else","data":[42]}'
    ])
    expect(console.error.args[2], 'to equal', ['{"foo":true}'])
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
        expect(console.error.args[0], 'to equal', ['{"message":"something"}'])
        done()
      })
  })
  it('logs single argument via failing promise', done => {
    process.env.LOG_LEVEL = 'WARN'
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
          /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)"\}$/
        )
        done()
      })
  })
})
