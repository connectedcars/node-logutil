const { logLevels } = require('./env')
const log = require('./log')

module.exports = (...args) => {
  return log(logLevels.ERROR, ...args)
}
