import { logLevels } from './levels'
import { log } from './log'

export function notice(...args: unknown[]): void {
  return log(logLevels.NOTICE, ...args)
}
