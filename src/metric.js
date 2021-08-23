const statistic = require('./statistic')
const error = require('./error')

const metricTypes = {
  GAUGE: 'GAUGE',
  CUMULATIVE: 'CUMULATIVE'
}

class MetricRegistry {
  constructor() {
    this.metrics = {}
  }

  convertTimestampToIsoString(metric) {
    if (metric.startTime) {
      metric.startTime = new Date(metric.startTime).toISOString()
    }
    metric.endTime = new Date(metric.endTime).toISOString()
    return metric
  }
  logMetrics() {
    const metrics = this.getMetrics()
    const result = {}

    for (const metric of metrics) {
      if (Date.now() - metric.endTime > 24 * 60 * 60 * 1000) {
        // Skip data points more than 24 hours old
        continue
      }

      const formattedMetric = this.convertTimestampToIsoString(metric)

      if (result[metric.name]) {
        result[metric.name].push(formattedMetric)
      } else {
        result[metric.name] = [formattedMetric]
      }
    }

    for (const metrics of Object.values(result)) {
      statistic('Metric dump', {
        metrics
      })
    }
  }
  getMetrics() {
    let result = []

    for (let key of Object.keys(this.metrics)) {
      const metric = { ...this.metrics[key] }
      metric.endTime = metric.endTime ? metric.endTime : Date.now()

      if (metric.reducerFn) {
        this.metrics[key].value = []
        metric.value = metric.reducerFn(metric.value)
      }

      result.push(metric)
    }

    return result
  }
  getPrometheusMetrics() {
    const result = []
    for (let metric of this.getMetrics()) {
      let labelsFormatted = ''

      if (metric.labels) {
        labelsFormatted = Object.keys(metric.labels)
          .map(k => `${k}='${metric.labels[k]}'`)
          .join(',')
        labelsFormatted = `{${labelsFormatted}}`
      }

      switch (metric.type) {
        case metricTypes.GAUGE: {
          result.push(`${metric.name}${labelsFormatted} ${metric.value}`)
          break
        }
        case metricTypes.CUMULATIVE: {
          result.push(`${metric.name}${labelsFormatted} ${metric.value} ${metric.endTime}`)
          break
        }
      }
    }
    return result
  }

  createKey(name, labels) {
    if (labels) {
      const labelKey = Object.keys(labels)
        .map(k => [k, labels[k]].join(':'))
        .join(':')
      return [name, labelKey].join('-')
    }

    return name
  }
  formatLabels(labels) {
    if (!labels) {
      return
    }
    for (const [key, value] of Object.entries(labels)) {
      labels[key] = String(value)
    }
  }

  gauge(name, value, labels, reducerFn = null) {
    try {
      this.formatLabels(labels)
      const key = this.createKey(name, labels)
      const metric = this.metrics[key]

      if (!metric) {
        this.metrics[key] = {
          name: name,
          type: metricTypes.GAUGE,
          value: reducerFn ? [value] : value,
          labels: labels
        }
        if (reducerFn) {
          this.metrics[key].reducerFn = reducerFn
        }
      } else {
        if (this.metrics[key].type !== metricTypes.GAUGE) {
          error('Cannot add gauge with same name as existing cumulative', { name, value, labels })
        }
        if (metric.reducerFn) {
          if (!reducerFn) {
            error('Gauge with reducer called without reducer', {
              name
            })
          }
          this.metrics[key].value.push(value)
        } else {
          if (reducerFn) {
            error('Gauge without reducer called with reducer', {
              name
            })
          }
          this.metrics[key].value = value
          this.metrics[key].endTime = Date.now()
        }
      }
    } catch (e) {
      error('Failed logging metric', {
        message: e.message,
        stack: e.stack
      })
    }
  }
  cumulative(name, value, labels) {
    try {
      this.formatLabels(labels)
      const key = this.createKey(name, labels)

      if (!this.metrics[key]) {
        this.metrics[key] = {
          name: name,
          type: metricTypes.CUMULATIVE,
          value: 0,
          labels: labels,
          startTime: Date.now()
        }
      }
      if (this.metrics[key].type !== metricTypes.CUMULATIVE) {
        error('Cannot add cumulative with same name as existing gauge', { name, value, labels })
      }
      this.metrics[key].value += value
    } catch (e) {
      error('Failed logging metric', {
        message: e.message,
        stack: e.stack
      })
    }
  }

  getMetric(name) {
    const metrics = Object.values(this.metrics).filter(m => m.name === name)

    if (metrics.length === 0) {
      return []
    }

    const res = []
    for (const metric of metrics) {
      const value = metric.reducerFn ? metric.reducerFn(metric.value) : metric.value
      const filteredMetric = { name: metric.name, type: metric.type, value, labels: metric.labels }
      filteredMetric.endTime = metric.endTime ? metric.endTime : Date.now()

      if (filteredMetric.type === metricTypes.CUMULATIVE) {
        filteredMetric.startTime = metric.startTime
      }
      res.push(filteredMetric)
    }
    return res
  }

  clearMetric(name) {
    const metrics = Object.keys(this.metrics).filter(key => this.metrics[key].name === name)
    for (const metricName of metrics) {
      delete this.metrics[metricName]
    }
  }

  getMetricNames() {
    return Object.keys(this.metrics)
  }
}

let metricRegistry
let scrapeInterval

async function logMetrics(delay) {
  if (!metricRegistry) {
    metricRegistry = new MetricRegistry()
  }
  if (delay > -1) {
    metricRegistry.logMetrics()
    scrapeInterval = setTimeout(() => logMetrics(delay), delay)
  }
}
function getMetricRegistry(delay = 60 * 1000) {
  if (!metricRegistry) {
    logMetrics(delay)
  }
  return metricRegistry
}

const clearMetricRegistry = () => {
  if (scrapeInterval) {
    clearInterval(scrapeInterval)
  }
  metricRegistry = null
}

module.exports = {
  getMetricRegistry,
  clearMetricRegistry
}

module.exports = { MetricRegistry, getMetricRegistry, clearMetricRegistry }
