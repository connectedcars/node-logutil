const { logLevels } = require('./levels')
const log = require('./log')

module.exports = (...args) => {
  return log(logLevels.WARN, ...args)
}
