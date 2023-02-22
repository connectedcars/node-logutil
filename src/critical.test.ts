import { EnvStub, TypedSinonStub } from '@connectedcars/test'
import sinon from 'sinon'

import * as log from './index'

describe('src/critical', () => {
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

  it('logs single argument', () => {
    log.critical('something')
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(1)
    expect(errorStub.args[0]).toEqual([
      '{"message":"something","severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs empty argument', () => {
    log.critical()
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(1)
    expect(errorStub.args[0]).toEqual(['{"severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'])
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'INFO'
    log.critical('something', 42, { foo: 'bar' })
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(1)
    expect(errorStub.args[0]).toEqual([
      '{"message":"something","data":[42,{"foo":"bar"}],"severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    log.critical('something')
    log.critical('something else', 42)
    log.critical({ foo: true })
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(3)
    expect(errorStub.args[0]).toEqual([
      '{"message":"something","severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(errorStub.args[1]).toEqual([
      '{"message":"something else","data":[42],"severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(errorStub.args[2]).toEqual(['{"foo":true,"severity":"CRITICAL","timestamp":"2017-09-01T13:37:42.000Z"}'])
  })
})
