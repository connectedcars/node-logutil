const statistic = require('./statistic')
let metrics = {}

const metricTypes = {
  GAUGE: 'GAUGE',
  CUMULATIVE: 'CUMULATIVE'
}

async function logMetrics() {
  for (let key of Object.values(metrics)) {
    statistic({ ...metrics[key], endTime: Date.now() })
  }
}

async function getMetrics() {
  let result = []

  for (let key of Object.keys(metrics)) {
    result.push({ ...metrics[key], endTime: Date.now() })
  }

  return result
}

async function getPrometheusMetrics() {
  const result = []
  for (let key of Object.keys(metrics)) {
    const metric = metrics[key]
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

async function gauge(name, value, labels) {
  const key = labels ? [name, ...Object.values(labels)].join(':') : name

  if (!metrics[key]) {
    metrics[key] = {
      name: name,
      type: metricTypes.GAUGE,
      value: value,
      labels: labels,
      startTime: Date.now()
    }
  } else {
    metrics[key].value = value
  }
}

async function cumulative(name, value, labels) {
  const key = labels ? [name, ...Object.values(labels)].join(':') : name

  if (!metrics[key]) {
    metrics[key] = {
      name: name,
      type: metricTypes.CUMULATIVE,
      value: 0,
      labels: labels,
      startTime: Date.now()
    }
  }

  metrics[key].value += value
}

function resetMetrics() {
  metrics = {}
}

module.exports = {
  cumulative,
  gauge,
  getMetrics,
  getPrometheusMetrics,
  logMetrics,
  metrics
}
