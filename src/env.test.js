const expect = require('unexpected')
const { logLevels, getLogLevel } = require('./env')

describe('src/env', () => {
  describe('getLogLevel', () => {
    beforeEach(() => {
      this.oldLogLevel = process.env.LOG_LEVEL
      delete process.env.LOG_LEVEL
    })
    afterEach(() => {
      process.env.LOG_LEVEL = this.oldLogLevel
    })

    it('defaults to WARN', () => {
      expect(getLogLevel(), 'to be', logLevels.WARN)
    })
    it('defaults to WARN for empty string', () => {
      process.env.LOG_LEVEL = ''
      expect(getLogLevel(), 'to be', logLevels.WARN)
    })
    it('has environment set to DEBUG', () => {
      process.env.LOG_LEVEL = 'DEBUG'
      expect(getLogLevel(), 'to be', logLevels.DEBUG)
    })
    it('has environment set to INFO', () => {
      process.env.LOG_LEVEL = 'INFO'
      expect(getLogLevel(), 'to be', logLevels.INFO)
    })
    it('has environment set to WARN', () => {
      process.env.LOG_LEVEL = 'WARN'
      expect(getLogLevel(), 'to be', logLevels.WARN)
    })
    it('has environment set to ERROR', () => {
      process.env.LOG_LEVEL = 'ERROR'
      expect(getLogLevel(), 'to be', logLevels.ERROR)
    })
    it('has environment set to lowercase', () => {
      process.env.LOG_LEVEL = 'error'
      expect(getLogLevel(), 'to be', logLevels.ERROR)
    })
    it('has environment set to mixed case', () => {
      process.env.LOG_LEVEL = 'Warn'
      expect(getLogLevel(), 'to be', logLevels.WARN)
    })
  })
})
