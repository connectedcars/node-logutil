import { logLevels } from './levels'
import { log } from './log'

export function critical(...args: unknown[]): void {
  return log(logLevels.CRITICAL, ...args)
}
