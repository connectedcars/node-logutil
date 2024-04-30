import { EnvStub, TypedSinonStub } from '@connectedcars/test'
import sinon from 'sinon'

import * as log from './index'

describe('src/journald', () => {
  let env: EnvStub
  let logStub: TypedSinonStub<typeof console.log>
  beforeEach(() => {
    env = new EnvStub(['LOG_LEVEL'])
    sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    logStub = sinon.stub(console, 'log')
  })
  afterEach(() => {
    env.restore()
    sinon.restore()
  })

  it('logs correct level', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    process.env.LOG_TARGET = 'journald'
    log.debug('something', { foo: 'bar' })
    log.info('something', { foo: 'bar' })
    log.notice('something', { foo: 'bar' })
    log.warn('something', { foo: 'bar' })
    log.error('something', { foo: 'bar' })
    log.critical('something', { foo: 'bar' })
    expect(logStub.args).toEqual([
      ['<7> [DEBUG] something {"foo":"bar"}'],
      ['<6> [INFO] something {"foo":"bar"}'],
      ['<5> [NOTICE] something {"foo":"bar"}'],
      ['<4> [WARNING] something {"foo":"bar"}'],
      ['<3> [ERROR] something {"foo":"bar"}'],
      ['<2> [CRITICAL] something {"foo":"bar"}']
    ])
  })
})
