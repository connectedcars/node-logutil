const { logLevels, getLogLevel } = require('./env')
const format = require('./format')

const isInfo = () => getLogLevel() <= logLevels.INFO

const log = (...args) => {
  console.log(format(...args))
}

module.exports = (...args) => {
  if (args.length > 0 && args[0] instanceof Function) {
    if (isInfo()) {
      return args[0]().then(log).catch(log)
    }
    return Promise.resolve()
  }
  if (isInfo()) {
    log(...args)
  }
}
