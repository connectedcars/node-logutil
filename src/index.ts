import { critical } from './critical'
import { debug } from './debug'
import { error } from './error'
import { info } from './info'
import { clearMetricRegistry, getMetricRegistry, MetricRegistry, MetricType } from './metric'
import { notice } from './notice'
import { statistic } from './statistic'
import { trace } from './trace'
import { warn } from './warn'

export {
  clearMetricRegistry,
  critical,
  debug,
  error,
  getMetricRegistry,
  info,
  MetricRegistry,
  notice,
  statistic,
  trace,
  warn
}

export type { MetricType }

// eslint-disable-next-line no-restricted-syntax
export default {
  trace,
  debug,
  statistic,
  notice,
  info,
  warn,
  error,
  critical,
  MetricRegistry,
  getMetricRegistry,
  clearMetricRegistry
}
