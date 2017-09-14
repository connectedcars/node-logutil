const expect = require('unexpected')
const sinon = require('sinon')
const log = require('./index')

describe('src/statistic', () => {
  beforeEach(() => {
    this.oldLogLevel = process.env.LOG_LEVEL
    delete process.env.LOG_LEVEL
    this.clock = sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    sinon.spy(console, 'warn')
    sinon.spy(console, 'error')
  })
  afterEach(() => {
    process.env.LOG_LEVEL = this.oldLogLevel
    this.clock.restore()
    console.warn.restore()
    console.error.restore()
  })

  it('logs nothing', () => {
    sinon.stub(console, 'log')
    log.statistic('something')
    expect(console.log.callCount, 'to be', 0)
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 0)
    console.log.restore()
  })
  it('logs single argument', () => {
    process.env.LOG_LEVEL = 'STATISTIC'
    sinon.stub(console, 'log')
    log.statistic('something')
    expect(console.log.callCount, 'to be', 1)
    expect(console.log.args[0], 'to equal', [
      '{"message":"something","level":"STATISTIC","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 0)
    console.log.restore()
  })
  it('logs empty argument', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    sinon.stub(console, 'log')
    log.statistic()
    expect(console.log.callCount, 'to be', 1)
    expect(console.log.args[0], 'to equal', [
      '{"level":"STATISTIC","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 0)
    console.log.restore()
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'statistic'
    sinon.stub(console, 'log')
    log.statistic('something', 42, { foo: 'bar' })
    expect(console.log.callCount, 'to be', 1)
    expect(console.log.args[0], 'to equal', [
      '{"message":"something","data":[42,{"foo":"bar"}],"level":"STATISTIC","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 0)
    console.log.restore()
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'STATISTIC'
    sinon.stub(console, 'log')
    log.statistic('something')
    log.statistic('something else', 42)
    log.statistic({ foo: true })
    expect(console.log.callCount, 'to be', 3)
    expect(console.log.args[0], 'to equal', [
      '{"message":"something","level":"STATISTIC","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(console.log.args[1], 'to equal', [
      '{"message":"something else","data":[42],"level":"STATISTIC","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(console.log.args[2], 'to equal', [
      '{"foo":true,"level":"STATISTIC","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(console.warn.callCount, 'to be', 0)
    expect(console.error.callCount, 'to be', 0)
    console.log.restore()
  })

  it('logs nothing via promise', done => {
    sinon.stub(console, 'log')
    const stub = sinon.stub()
    log
      .statistic(() => {
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
    process.env.LOG_LEVEL = 'STATISTIC'
    sinon.stub(console, 'log')
    const stub = sinon.stub()
    log
      .statistic(() => {
        return new Promise(resolve => {
          stub()
          resolve('something')
        })
      })
      .then(() => {
        expect(stub.callCount, 'to be', 1)
        expect(console.log.callCount, 'to be', 1)
        expect(console.log.args[0], 'to equal', [
          '{"message":"something","level":"STATISTIC","timestamp":"2017-09-01T13:37:42.000Z"}'
        ])
        expect(console.warn.callCount, 'to be', 0)
        expect(console.error.callCount, 'to be', 0)
        console.log.restore()
        done()
      })
  })
  it('logs single argument via function', done => {
    process.env.LOG_LEVEL = 'STATISTIC'
    sinon.stub(console, 'log')
    log
      .statistic(() => {
        return 'something'
      })
      .then(() => {
        expect(console.log.callCount, 'to be', 1)
        expect(console.log.args[0], 'to equal', [
          '{"message":"something","level":"STATISTIC","timestamp":"2017-09-01T13:37:42.000Z"}'
        ])
        expect(console.warn.callCount, 'to be', 0)
        expect(console.error.callCount, 'to be', 0)
        console.log.restore()
        done()
      })
  })
  it('logs single argument via failing promise', done => {
    process.env.LOG_LEVEL = 'STATISTIC'
    sinon.stub(console, 'log')
    log
      .statistic(() => {
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
          /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","level":"STATISTIC","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
        )
        expect(console.warn.callCount, 'to be', 0)
        expect(console.error.callCount, 'to be', 0)
        console.log.restore()
        done()
      })
  })
  it('logs single argument via exceptional function', done => {
    process.env.LOG_LEVEL = 'STATISTIC'
    sinon.stub(console, 'log')
    log
      .statistic(() => {
        throw new Error('wrah')
        return new Promise(resolve => {
          resolve('something')
        })
      })
      .then(() => {
        expect(console.log.callCount, 'to be', 1)
        expect(console.log.args[0], 'to have length', 1)
        expect(
          console.log.args[0][0],
          'to match',
          /^\{"message":"wrah","stack":"Error: wrah\\n(.+?)","level":"STATISTIC","timestamp":"2017-09-01T13:37:42\.000Z"\}$/
        )
        expect(console.warn.callCount, 'to be', 0)
        expect(console.error.callCount, 'to be', 0)
        console.log.restore()
        done()
      })
  })
})
