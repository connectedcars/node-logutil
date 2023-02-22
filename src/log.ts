/* eslint-disable no-console */
import { format } from './format'
import { getLogLevel, logLevels } from './levels'

export function log(level: number, ...args: unknown[]): void {
  if (getLogLevel() <= level) {
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
