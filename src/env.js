const logLevels = {
  ERROR: 40,
  WARN: 30,
  INFO: 20,
  DEBUG: 10
}

const getLogLevel = () => {
  let logLevel = process.env.LOG_LEVEL || ''
  logLevel = logLevel.toUpperCase()
  if (logLevel in logLevels) {
    return logLevels[logLevel]
  }
  return logLevels.WARN
}

module.exports = {
  logLevels,
  getLogLevel
}
