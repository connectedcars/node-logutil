import { logLevels } from './levels'
import { log } from './log'

export function debug(...args: unknown[]): void {
  return log(logLevels.DEBUG, ...args)
}
