const { EventEmitter } = require('events')

const statistic = require('./statistic')

const metricTypes = {
  GAUGE: 'GAUGE',
  CUMULATIVE: 'CUMULATIVE'
}

class MetricRegistry {
  constructor(metricOptions) {
    this.metrics = {}

    if (metricOptions.includeLogStats) {
      this._initLogStats()
    }
  }

  _initLogStats() {
    const statsEmitter = new EventEmitter()

    statsEmitter.on('log-stats', stats => {
      this.cumulative('log-stats', stats.size, {
        truncatedLogLine: stats.truncatedLogLine
      })
    })
  }

  convertTimestampToIsoString(metric) {
    if (metric.startTime) {
      metric.startTime = new Date(metric.startTime).toISOString()
    }
    metric.endTime = new Date(metric.endTime).toISOString()
    return metric
  }
  async logMetrics() {
    const metrics = await this.getMetrics()

    statistic(`Metric dump`, {
      metrics: metrics.map(this.convertTimestampToIsoString)
    })
  }
  async getMetrics() {
    let result = []

    for (let key of Object.keys(this.metrics)) {
      const metric = { ...this.metrics[key] }
      metric.endTime = metric.endTime ? metric.endTime : Date.now()

      if (metric.reducerFn) {
        this.metrics[key].value = []
        metric.value = metric.reducerFn(metric.value)
        delete metric.reducerFn
      }

      result.push(metric)
    }

    return result
  }
  async getPrometheusMetrics() {
    const result = []
    for (let metric of await this.getMetrics()) {
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
  async gauge(name, value, labels, reducerFn = null) {
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
    } else if (metric.reducerFn) {
      this.metrics[key].value.push(value)
    } else {
      this.metrics[key].value = value
      this.metrics[key].endTime = Date.now()
    }
  }
  async cumulative(name, value, labels) {
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

    this.metrics[key].value += value
  }
}

module.exports = MetricRegistry
