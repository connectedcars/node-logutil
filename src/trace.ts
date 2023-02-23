import { logLevels } from './levels'
import { log } from './log'

export function trace(...args: unknown[]): void {
  return log(logLevels.TRACE, ...args)
}
