import { logLevels } from './levels'
import { log } from './log'

export function error(...args: unknown[]): void {
  return log(logLevels.ERROR, ...args)
}
