import { logLevels } from './levels'
import { log } from './log'

export function statistic(...args: unknown[]): void {
  return log(logLevels.STATISTIC, ...args)
}
