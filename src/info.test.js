const expect = require('unexpected')
const sinon = require('sinon')
const log = require('./index')

describe('src/info', () => {
  beforeEach(() => {
    this.oldLogLevel = process.env.LOG_LEVEL
    delete process.env.LOG_LEVEL
    sinon.spy(console, 'warn')
    sinon.spy(console, 'error')
  })
  afterEach(() => {
    process.env.LOG_LEVEL = this.oldLogLevel
    console.warn.restore()
    console.error.restore()
  })

  it('logs nothing', () => {
    sinon.stub(console, 'log')
    log.info('something')
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 0)
    console.log.restore()
  })
  it('logs single argument', () => {
    process.env.LOG_LEVEL = 'INFO'
    sinon.stub(console, 'log')
    log.info('something')
    expect(console.log.callCount, 'to be', 1)
    expect(console.log.args[0], 'to equal', ['{"message":"something"}'])
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 0)
    console.log.restore()
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'info'
    sinon.stub(console, 'log')
    log.info('something', 42, { foo: 'bar' })
    expect(console.log.callCount, 'to be', 1)
    expect(console.log.args[0], 'to equal', [
      '{"message":"something","data":[42,{"foo":"bar"}]}'
    ])
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 0)
    console.log.restore()
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'INFO'
    sinon.stub(console, 'log')
    log.info('something')
    log.info('something else', 42)
    log.info({ foo: true })
    expect(console.log.callCount, 'to be', 3)
    expect(console.log.args[0], 'to equal', ['{"message":"something"}'])
    expect(console.log.args[1], 'to equal', [
      '{"message":"something else","data":[42]}'
    ])
    expect(console.log.args[2], 'to equal', ['{"foo":true}'])
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 0)
    console.log.restore()
  })

  it('logs nothing via promise', done => {
    sinon.stub(console, 'log')
    const stub = sinon.stub()
    log
      .info(() => {
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
        console.log.restore()
        done()
      })
  })
  it('logs single argument via promise', done => {
    process.env.LOG_LEVEL = 'INFO'
    sinon.stub(console, 'log')
    const stub = sinon.stub()
    log
      .info(() => {
        return new Promise(resolve => {
          stub()
          resolve('something')
        })
      })
      .then(() => {
        expect(stub.callCount, 'to be', 1)
        expect(console.log.callCount, 'to be', 1)
        expect(console.log.args[0], 'to equal', ['{"message":"something"}'])
        expect(console.warn.callCount, 'to be', 0)
        expect(console.error.callCount, 'to be', 0)
        console.log.restore()
        done()
      })
  })
  it('logs single argument via failing promise', done => {
    process.env.LOG_LEVEL = 'INFO'
    sinon.stub(console, 'log')
    log
      .info(() => {
        return new Promise((resolve, reject) => {
          reject(new Error('wrah'))
        })
      })
      .then(() => {
        expect(console.log.callCount, 'to be', 1)
        expect(console.log.args[0], 'to have length', 1)
        expect(
          console.log.args[0][0],
          'to match',
          /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)"\}$/
        )
        expect(console.warn.callCount, 'to be', 0)
        expect(console.error.callCount, 'to be', 0)
        console.log.restore()
        done()
      })
  })
})
