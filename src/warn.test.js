const expect = require('unexpected')
const sinon = require('sinon')
const log = require('./index')

describe('src/warn', () => {
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

  it('logs nothing', () => {
    process.env.LOG_LEVEL = 'ERROR'
    log.warn('something')
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 0)
  })
  it('logs single argument', () => {
    log.warn('something')
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 1)
    expect(console.warn.args[0], 'to equal', ['{"message":"something"}'])
    expect(console.error.callCount, 'to be', 0)
  })
  it('logs empty argument', () => {
    log.warn()
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 1)
    expect(console.warn.args[0], 'to equal', ['{}'])
    expect(console.error.callCount, 'to be', 0)
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'INFO'
    log.warn('something', 42, { foo: 'bar' })
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 1)
    expect(console.warn.args[0], 'to equal', [
      '{"message":"something","data":[42,{"foo":"bar"}]}'
    ])
    expect(console.error.callCount, 'to be', 0)
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    log.warn('something')
    log.warn('something else', 42)
    log.warn({ foo: true })
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 3)
    expect(console.warn.args[0], 'to equal', ['{"message":"something"}'])
    expect(console.warn.args[1], 'to equal', [
      '{"message":"something else","data":[42]}'
    ])
    expect(console.warn.args[2], 'to equal', ['{"foo":true}'])
    expect(console.error.callCount, 'to be', 0)
  })

  it('logs nothing via promise', done => {
    process.env.LOG_LEVEL = 'ERROR'
    const stub = sinon.stub()
    log
      .warn(() => {
        return new Promise(resolve => {
          stub()
          resolve('something')
        })
      })
      .then(() => {
        expect(stub.callCount, 'to be', 0)
        expect(console.log.callCount, 'to be', 0)
        expect(console.warn.callCount, 'to be', 0)
        expect(console.error.callCount, 'to be', 0)
        done()
      })
  })
  it('logs single argument via promise', done => {
    process.env.LOG_LEVEL = 'WARN'
    const stub = sinon.stub()
    log
      .warn(() => {
        return new Promise(resolve => {
          stub()
          resolve('something')
        })
      })
      .then(() => {
        expect(stub.callCount, 'to be', 1)
        expect(console.log.callCount, 'to be', 0)
        expect(console.warn.callCount, 'to be', 1)
        expect(console.warn.args[0], 'to equal', ['{"message":"something"}'])
        expect(console.error.callCount, 'to be', 0)
        done()
      })
  })
  it('logs single argument via function', done => {
    log
      .warn(() => {
        return 'something'
      })
      .then(() => {
        expect(console.log.callCount, 'to be', 0)
        expect(console.warn.callCount, 'to be', 1)
        expect(console.warn.args[0], 'to equal', ['{"message":"something"}'])
        expect(console.error.callCount, 'to be', 0)
        done()
      })
  })
  it('logs single argument via failing promise', done => {
    log
      .warn(() => {
        return new Promise((resolve, reject) => {
          reject(new Error('wrah'))
        })
      })
      .then(() => {
        expect(console.log.callCount, 'to be', 0)
        expect(console.warn.callCount, 'to be', 1)
        expect(console.warn.args[0], 'to have length', 1)
        expect(
          console.warn.args[0][0],
          'to match',
          /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)"\}$/
        )
        expect(console.error.callCount, 'to be', 0)
        done()
      })
  })
  it('logs single argument via exceptional function', done => {
    log
      .warn(() => {
        throw new Error('wrah')
        return new Promise(resolve => {
          resolve('something')
        })
      })
      .then(() => {
        expect(console.log.callCount, 'to be', 0)
        expect(console.warn.callCount, 'to be', 1)
        expect(console.warn.args[0], 'to have length', 1)
        expect(
          console.warn.args[0][0],
          'to match',
          /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)"\}$/
        )
        expect(console.error.callCount, 'to be', 0)
        done()
      })
  })
})
