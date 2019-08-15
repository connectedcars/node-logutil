const logLevels = {
  CRITICAL: 50,
  ERROR: 40,
  WARNING: 30,
  INFO: 20,
  STATISTIC: 15,
  DEBUG: 10
}

const getLogLevel = () => {
  let logLevel = process.env.LOG_LEVEL || ''
  logLevel = logLevel.toUpperCase()
  if (logLevel in logLevels) {
    return logLevels[logLevel]
  }
  return logLevels.WARNING
}

const getLogLevelName = logLevel => {
  let level = 'UNKNOWN'
  for (const key in logLevels) {
    if (logLevel === logLevels[key]) {
      level = key
      break
    }
  }
  return level
}

module.exports = {
  logLevels,
  getLogLevel,
  getLogLevelName
}
