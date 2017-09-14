const expect = require('unexpected')
const { logLevels, getLogLevel, getLogLevelName } = require('./levels')

describe('src/levels', () => {
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
    it('has environment set to STATISTIC', () => {
      process.env.LOG_LEVEL = 'STATISTIC'
      expect(getLogLevel(), 'to be', logLevels.STATISTIC)
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
  describe('getLogLevelName', () => {
    it('gets ERROR', () => {
      expect(getLogLevelName(40), 'to be', 'ERROR')
    })
    it('gets WARN', () => {
      expect(getLogLevelName(30), 'to be', 'WARN')
    })
    it('gets INFO', () => {
      expect(getLogLevelName(20), 'to be', 'INFO')
    })
    it('gets STATISTIC', () => {
      expect(getLogLevelName(15), 'to be', 'STATISTIC')
    })
    it('gets DEBUG', () => {
      expect(getLogLevelName(10), 'to be', 'DEBUG')
    })
    it('gets UNKNOWN for invalid level', () => {
      expect(getLogLevelName(1337), 'to be', 'UNKNOWN')
    })
    it('gets UNKNOWN for no level', () => {
      expect(getLogLevelName(), 'to be', 'UNKNOWN')
    })
  })
})
