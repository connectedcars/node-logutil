const { logLevels, getLogLevel } = require('./env')
const format = require('./format')

const isWarn = () => getLogLevel() <= logLevels.WARN

const log = (...args) => {
  console.warn(format(...args))
}

module.exports = (...args) => {
  if (args.length > 0 && args[0] instanceof Function) {
    if (isWarn()) {
      return args[0]().then(log).catch(log)
    }
    return Promise.resolve()
  }
  if (isWarn()) {
    log(...args)
  }
}
