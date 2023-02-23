export const logLevels = {
  CRITICAL: 50,
  ERROR: 40,
  WARN: 30,
  INFO: 20,
  STATISTIC: 15,
  DEBUG: 10,
  TRACE: 5
}

export function getLogLevel(): number {
  let logLevel = process.env.LOG_LEVEL || ''
  logLevel = logLevel.toUpperCase()
  if (logLevel in logLevels) {
    return logLevels[logLevel as keyof typeof logLevels]
  }
  return logLevels.WARN
}

export function getLogLevelName(logLevel: number): string {
  switch (logLevel) {
    case logLevels.CRITICAL:
      return 'CRITICAL'
    case logLevels.ERROR:
      return 'ERROR'
    case logLevels.WARN:
      return 'WARNING' // Override for stackdriver severity
    case logLevels.INFO:
      return 'INFO'
    case logLevels.STATISTIC:
      return 'STATISTIC'
    case logLevels.DEBUG:
      return 'DEBUG'
    case logLevels.TRACE:
      return 'TRACE'
    default:
      return 'UNKNOWN'
  }
}
