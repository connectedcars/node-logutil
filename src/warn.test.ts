import { EnvStub, TypedSinonStub } from '@connectedcars/test'
import sinon from 'sinon'

import * as log from './index'

describe('src/warn', () => {
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
    process.env.LOG_LEVEL = 'ERROR'
    log.warn('something')
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(0)
  })
  it('logs single argument', () => {
    log.warn('something')
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(1)
    expect(warnStub.args[0]).toEqual([
      '{"message":"something","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(errorStub.callCount).toEqual(0)
  })
  it('logs empty argument', () => {
    log.warn()
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(1)
    expect(warnStub.args[0]).toEqual(['{"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'])
    expect(errorStub.callCount).toEqual(0)
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'INFO'
    log.warn('something', 42, { foo: 'bar' })
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(1)
    expect(warnStub.args[0]).toEqual([
      '{"message":"something","data":[42,{"foo":"bar"}],"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(errorStub.callCount).toEqual(0)
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    log.warn('something')
    log.warn('something else', 42)
    log.warn({ foo: true })
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(3)
    expect(warnStub.args[0]).toEqual([
      '{"message":"something","severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(warnStub.args[1]).toEqual([
      '{"message":"something else","data":[42],"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(warnStub.args[2]).toEqual(['{"foo":true,"severity":"WARNING","timestamp":"2017-09-01T13:37:42.000Z"}'])
    expect(errorStub.callCount).toEqual(0)
  })
})
