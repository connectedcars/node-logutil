import { critical } from './critical'
import { debug } from './debug'
import { error } from './error'
import { info } from './info'
import { clearMetricRegistry, getMetricRegistry, MetricRegistry } from './metric'
import { statistic } from './statistic'
import { trace } from './trace'
import { warn } from './warn'

export { critical }
export { debug }
export { error }
export { info }
export { clearMetricRegistry, getMetricRegistry, MetricRegistry }
export { statistic }
export { trace }
export { warn }

// eslint-disable-next-line no-restricted-syntax
export default {
  trace,
  debug,
  statistic,
  info,
  warn,
  error,
  critical,
  MetricRegistry,
  getMetricRegistry,
  clearMetricRegistry
}
