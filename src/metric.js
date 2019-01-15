const statistic = require('./statistic')

const metricTypes = {
  GAUGE: 'GAUGE',
  CUMULATIVE: 'CUMULATIVE'
}

class MetricRegistry {
  constructor() {
    this.metrics = {}
  }
  async logMetrics() {
    for (let key of Object.values(this.metrics)) {
      statistic({ ...this.metrics[key], endTime: Date.now() })
    }
  }
  async getMetrics() {
    let result = []

    for (let key of Object.keys(this.metrics)) {
      result.push({ ...this.metrics[key], endTime: Date.now() })
    }

    return result
  }
  async getPrometheusMetrics() {
    const result = []
    for (let key of Object.keys(this.metrics)) {
      const metric = this.metrics[key]
      const labels = Object.keys(metric.labels).map(k => `${k}='${metric[k]}'`)

      switch (metric.type) {
        case metricTypes.GAUGE: {
          result.push(`${metric.name}{${labels.join(',')}} ${metric.value}`)
          break
        }
        case metricTypes.CUMULATIVE: {
          result.push(
            `${metric.name}{${labels.join(',')}} ${metric.value} ${Date.now()}`
          )
          break
        }
        default: {
          continue
        }
      }
    }
    return result
  }

  createKey(name, labels) {
    return labels ? [name, ...Object.values(labels)].join(':') : name
  }
  async gauge(name, value, labels) {
    const key = this.createKey(name, labels)

    if (!this.metrics[key]) {
      this.metrics[key] = {
        name: name,
        type: metricTypes.GAUGE,
        value: value,
        labels: labels,
        startTime: Date.now()
      }
    } else {
      this.metrics[key].value = value
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

module.exports = {
  MetricRegistry,
  metricTypes
}
