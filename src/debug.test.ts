import { EnvStub, TypedSinonStub } from '@connectedcars/test'
import sinon from 'sinon'

import * as log from './index'

describe('src/debug', () => {
  let env: EnvStub
  let logStub: TypedSinonStub<typeof console.log>
  let warnStub: TypedSinonStub<typeof console.warn>
  let errorStub: TypedSinonStub<typeof console.error>
  beforeEach(() => {
    env = new EnvStub(['LOG_LEVEL'])
    sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    logStub = sinon.stub(console, 'log')
    warnStub = sinon.stub(console, 'warn')
    errorStub = sinon.stub(console, 'error')
  })
  afterEach(() => {
    env.restore()
    sinon.restore()
  })

  it('logs nothing', () => {
    log.debug('something')
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(0)
  })
  it('logs single argument', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    log.debug('something')
    expect(logStub.callCount).toEqual(1)
    expect(logStub.args[0]).toEqual([
      '{"message":"something","severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(0)
  })
  it('logs empty argument', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    log.debug()
    expect(logStub.callCount).toEqual(1)
    expect(logStub.args[0]).toEqual(['{"severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'])
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(0)
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'debug'
    log.debug('something', 42, { foo: 'bar' })
    expect(logStub.callCount).toEqual(1)
    expect(logStub.args[0]).toEqual([
      '{"message":"something","data":[42,{"foo":"bar"}],"severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(0)
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    log.debug('something')
    log.debug('something else', 42)
    log.debug({ foo: true })
    expect(logStub.callCount).toEqual(3)
    expect(logStub.args[0]).toEqual([
      '{"message":"something","severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(logStub.args[1]).toEqual([
      '{"message":"something else","data":[42],"severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(logStub.args[2]).toEqual(['{"foo":true,"severity":"DEBUG","timestamp":"2017-09-01T13:37:42.000Z"}'])
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(0)
  })
})
