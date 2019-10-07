const { logLevels, getLogLevel } = require('./levels')
const { format } = require('./format')
const EventEmitter = require('events')

const statsEmitter = new EventEmitter()
const MAX_STRING_LENGTH = 50

const doLog = (level, ...args) => {
  const output = format(level, ...args)

  statsEmitter.emit('log-stats', {
    size: output.length,
    truncatedLogLine: output.substring(0, MAX_STRING_LENGTH)
  })
  switch (level) {
    case logLevels.CRITICAL:
    case logLevels.ERROR:
      console.error(output)
      break
    case logLevels.WARN:
      console.warn(output)
      break
    default:
      console.log(output)
      break
  }
}

module.exports = (level, ...args) => {
  const shouldLog = getLogLevel() <= level
  if (args.length > 0 && args[0] instanceof Function) {
    if (shouldLog) {
      try {
        return Promise.resolve(args[0]())
          .then(res => {
            doLog(level, res)
          })
          .catch(e => {
            doLog(level, e)
          })
      } catch (e) {
        doLog(level, e)
      }
    }
    return Promise.resolve()
  }
  if (shouldLog) {
    doLog(level, ...args)
  }
}
