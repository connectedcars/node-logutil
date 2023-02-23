import { EnvStub, TypedSinonStub } from '@connectedcars/test'
import sinon from 'sinon'

import * as log from './index'

describe('src/error', () => {
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
    log.error('something')
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(1)
    expect(errorStub.args[0]).toEqual([
      '{"message":"something","severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs empty argument', () => {
    log.error()
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(1)
    expect(errorStub.args[0]).toEqual(['{"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'])
  })
  it('logs multiple arguments', () => {
    process.env.LOG_LEVEL = 'INFO'
    log.error('something', 42, { foo: 'bar' })
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(1)
    expect(errorStub.args[0]).toEqual([
      '{"message":"something","data":[42,{"foo":"bar"}],"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
  })
  it('logs multiple times', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    log.error('something')
    log.error('something else', 42)
    log.error({ foo: true })
    expect(logStub.callCount).toEqual(0)
    expect(warnStub.callCount).toEqual(0)
    expect(errorStub.callCount).toEqual(3)
    expect(errorStub.args[0]).toEqual([
      '{"message":"something","severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(errorStub.args[1]).toEqual([
      '{"message":"something else","data":[42],"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
    ])
    expect(errorStub.args[2]).toEqual(['{"foo":true,"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'])
  })
})
