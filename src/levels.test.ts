import { EnvStub } from '@connectedcars/test'

import { getLogLevel, getLogLevelName, logLevels } from './levels'

describe('src/levels', () => {
  describe('getLogLevel', () => {
    let env: EnvStub
    beforeEach(() => {
      env = new EnvStub(['LOG_LEVEL'])
    })
    afterEach(() => {
      env.restore()
    })

    it('defaults to WARN', () => {
      expect(getLogLevel()).toEqual(logLevels.WARN)
    })
    it('defaults to WARN for empty string', () => {
      process.env.LOG_LEVEL = ''
      expect(getLogLevel()).toEqual(logLevels.WARN)
    })
    it('has environment set to DEBUG', () => {
      process.env.LOG_LEVEL = 'DEBUG'
      expect(getLogLevel()).toEqual(logLevels.DEBUG)
    })
    it('has environment set to STATISTIC', () => {
      process.env.LOG_LEVEL = 'STATISTIC'
      expect(getLogLevel()).toEqual(logLevels.STATISTIC)
    })
    it('has environment set to INFO', () => {
      process.env.LOG_LEVEL = 'INFO'
      expect(getLogLevel()).toEqual(logLevels.INFO)
    })
    it('has environment set to WARN', () => {
      process.env.LOG_LEVEL = 'WARN'
      expect(getLogLevel()).toEqual(logLevels.WARN)
    })
    it('has environment set to ERROR', () => {
      process.env.LOG_LEVEL = 'ERROR'
      expect(getLogLevel()).toEqual(logLevels.ERROR)
    })
    it('has environment set to CRITICAL', () => {
      process.env.LOG_LEVEL = 'CRITICAL'
      expect(getLogLevel()).toEqual(logLevels.CRITICAL)
    })
    it('has environment set to lowercase', () => {
      process.env.LOG_LEVEL = 'error'
      expect(getLogLevel()).toEqual(logLevels.ERROR)
    })
    it('has environment set to mixed case', () => {
      process.env.LOG_LEVEL = 'Warn'
      expect(getLogLevel()).toEqual(logLevels.WARN)
    })
  })
  describe('getLogLevelName', () => {
    it('gets CRITICAL', () => {
      expect(getLogLevelName(50)).toEqual('CRITICAL')
    })
    it('gets ERROR', () => {
      expect(getLogLevelName(40)).toEqual('ERROR')
    })
    it('gets WARN', () => {
      expect(getLogLevelName(30)).toEqual('WARNING')
    })
    it('gets INFO', () => {
      expect(getLogLevelName(20)).toEqual('INFO')
    })
    it('gets STATISTIC', () => {
      expect(getLogLevelName(15)).toEqual('STATISTIC')
    })
    it('gets DEBUG', () => {
      expect(getLogLevelName(10)).toEqual('DEBUG')
    })
    it('gets UNKNOWN for invalid level', () => {
      expect(getLogLevelName(1337)).toEqual('UNKNOWN')
    })
    it('gets UNKNOWN for no level', () => {
      expect(getLogLevelName(0)).toEqual('UNKNOWN')
    })
  })
})
