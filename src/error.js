const { logLevels, getLogLevel } = require('./env')
const format = require('./format')

const isError = () => getLogLevel() <= logLevels.ERROR

const log = (...args) => {
  console.error(format(...args))
}

module.exports = (...args) => {
  if (args.length > 0 && args[0] instanceof Function) {
    if (isError()) {
      return args[0]().then(log).catch(log)
    }
    return Promise.resolve()
  }
  if (isError()) {
    log(...args)
  }
}
