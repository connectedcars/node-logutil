/* eslint-disable no-console */
import { format } from './format'
import { logJournald } from './journald'
import { getLogLevel, logLevels } from './levels'

function getTarget(): 'TEXT' | 'JOURNALD' {
  let format = process.env.LOG_TARGET || ''
  format = format.toUpperCase()
  if (format === 'JOURNALD') {
    return 'JOURNALD'
  }
  return 'TEXT'
}

export function log(level: number, ...args: unknown[]): void {
  if (getLogLevel() <= level) {
    if (getTarget() === 'JOURNALD') {
      logJournald(level, ...args)
    } else {
      const output = format(level, ...args)
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
  }
}
