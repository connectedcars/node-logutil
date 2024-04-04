import { JavaScriptValue, objectToJson } from './json'
import { getLogLevel, logLevels } from './levels'

export const journaldLevels = {
  DEBUG: 7,
  INFO: 6,
  NOTICE: 5,
  WARNING: 4,
  ERROR: 3,
  CRITICAL: 2,
  ALERT: 1, // not used
  EMERGENCY: 0 // not used
}

function logLevelToJournaldLevel(
  logLevel: typeof logLevels[keyof typeof logLevels]
): typeof journaldLevels[keyof typeof journaldLevels] {
  switch (logLevel) {
    case logLevels.CRITICAL:
      return journaldLevels.CRITICAL
    case logLevels.ERROR:
      return journaldLevels.ERROR
    case logLevels.WARN:
      return journaldLevels.WARNING
    case logLevels.NOTICE:
      return journaldLevels.NOTICE
    case logLevels.INFO:
      return journaldLevels.INFO
    case logLevels.STATISTIC:
      return journaldLevels.INFO
    case logLevels.DEBUG:
      return journaldLevels.DEBUG
    case logLevels.TRACE:
      return journaldLevels.DEBUG
    default:
      return journaldLevels.INFO
  }
}

export function logJournald(level: number, ...args: unknown[]): void {
  if (getLogLevel() <= level) {
    const output = args
      .map(a => {
        const o = objectToJson(a as JavaScriptValue)
        return typeof o === 'string' ? o : JSON.stringify(o)
      })
      .join(' ')
    const journaldLevel = logLevelToJournaldLevel(level)
    // eslint-disable-next-line no-console
    console.log(`<${journaldLevel}> ${output}`)
  }
}
