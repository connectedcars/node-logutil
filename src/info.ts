import { logLevels } from './levels'
import { log } from './log'

export function info(...args: unknown[]): void {
  return log(logLevels.INFO, ...args)
}
