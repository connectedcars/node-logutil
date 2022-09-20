const { MetricRegistry, getMetricRegistry, clearMetricRegistry } = require('./metric')
module.exports = {
  trace: require('./trace'),
  debug: require('./debug'),
  statistic: require('./statistic'),
  info: require('./info'),
  warn: require('./warn'),
  error: require('./error'),
  critical: require('./critical'),
  MetricRegistry,
  getMetricRegistry,
  clearMetricRegistry
}
