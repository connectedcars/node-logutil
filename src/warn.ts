import { logLevels } from './levels'
import { log } from './log'

export function warn(...args: unknown[]): void {
  return log(logLevels.WARN, ...args)
}
