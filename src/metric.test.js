const expect = require('unexpected')
const MetricRegistry = require('./metric')
const sinon = require('sinon')

describe('src/metric.js', () => {
  beforeEach(() => {
    this.createKey = sinon.spy(MetricRegistry.prototype, 'createKey')
    this.clock = sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    this.metricRegistry = new MetricRegistry()

    process.env.LOG_LEVEL = 'STATISTIC'
    this.statistic = sinon.spy(console, 'log')
  })
  afterEach(async () => {
    sinon.restore()
  })

  it('creates cumulative metrics', async () => {
    let value = 10

    const name = 'my-metric'
    const labels = { brand: 'vw' }

    for (let i = 1; i <= 4; i++) {
      await this.metricRegistry.cumulative(name, value, labels)

      expect(this.metricRegistry.metrics['my-metric-brand:vw'], 'to equal', {
        name: name,
        type: 'CUMULATIVE',
        value: value * i,
        labels: labels,
        startTime: 1504273062000
      })
    }

    expect(this.createKey.callCount, 'to be', 4)
    expect(this.createKey.args[0], 'to equal', [name, labels])
  })

  it('creates gauge metric', async () => {
    const name = 'gauge-metric'
    const key = 'gauge-metric-brand:vw'
    const labels = { brand: 'vw' }
    await Promise.all(
      [50, 50, 0, 50].map(value =>
        this.metricRegistry.gauge(name, value, labels)
      )
    )

    expect(this.metricRegistry.metrics, 'to have key', key)

    expect(this.metricRegistry.metrics[key], 'to have key', 'endTime')
    expect(this.metricRegistry.metrics[key], 'to equal', {
      name: 'gauge-metric',
      type: 'GAUGE',
      value: 50,
      labels: { brand: 'vw' },
      endTime: 1504273062000
    })

    await Promise.all(
      [20, 40, 80].map(value =>
        this.metricRegistry.gauge(name, value, { brand: 'foo' })
      )
    )

    const anotherKey = 'gauge-metric-brand:foo'
    expect(this.metricRegistry.metrics, 'to have key', anotherKey)
    expect(this.metricRegistry.metrics[anotherKey], 'to have key', 'endTime')
    expect(this.metricRegistry.metrics[anotherKey], 'to equal', {
      name: 'gauge-metric',
      type: 'GAUGE',
      value: 80,
      labels: { brand: 'foo' },
      endTime: 1504273062000
    })

    expect(this.createKey.callCount, 'to be', 7)
    expect(this.createKey.args[0], 'to equal', [name, labels])
  })

  it('creates gauge metric with reducer function', async () => {
    const fn = arr => arr.reduce((a, b) => a + b) / arr.length
    await this.metricRegistry.gauge('baz', 20, null, fn)
    await this.metricRegistry.gauge('baz', 30, null, fn)

    expect(this.metricRegistry.metrics['baz'], 'to equal', {
      value: [20, 30],
      name: 'baz',
      type: 'GAUGE',
      reducerFn: fn,
      labels: null
    })

    const metrics = await this.metricRegistry.getMetrics()

    expect(metrics[0], 'to equal', {
      value: 25,
      name: 'baz',
      type: 'GAUGE',
      labels: null,
      endTime: 1504273062000
    })
  })

  it('dumps all metrics', async () => {
    await this.metricRegistry.gauge('abc', 2, null)
    await this.metricRegistry.gauge('abc', 2, null)
    await this.metricRegistry.gauge('foo', 4, { a: 'b' })
    await this.metricRegistry.cumulative('baz', 1, null)

    const actualMetric = await this.metricRegistry.getMetrics()

    expect(actualMetric, 'to equal', [
      {
        name: 'abc',
        type: 'GAUGE',
        value: 2,
        labels: null,
        endTime: 1504273062000
      },
      {
        name: 'foo',
        type: 'GAUGE',
        value: 4,
        labels: { a: 'b' },
        endTime: 1504273062000
      },
      {
        name: 'baz',
        type: 'CUMULATIVE',
        value: 1,
        labels: null,
        startTime: 1504273062000,
        endTime: 1504273062000
      }
    ])
  })

  it('creates the correct prometheus format', async () => {
    await this.metricRegistry.gauge('abc', 2, null)
    await this.metricRegistry.gauge('foo', 4, { brand: 'vw' })
    await this.metricRegistry.cumulative('baz', 8, { model: 'touran' })
    const actualMetric = await this.metricRegistry.getPrometheusMetrics()
    expect(actualMetric, 'to equal', [
      'abc 2',
      "foo{brand='vw'} 4",
      "baz{model='touran'} 8 1504273062000"
    ])
  })

  it('metric key is constructed correctly', async () => {
    const key = this.metricRegistry.createKey('name', { a: 'b' })
    expect(key, 'to equal', 'name-a:b')
  })

  it('logs all metrics', async () => {
    await this.metricRegistry.gauge('gauge', 4, { brand: 'vw' })
    await this.metricRegistry.cumulative('cumulative', 20, { brand: 'vw' })
    await this.metricRegistry.logMetrics()

    expect(this.statistic.callCount, 'to be', 1)
    expect(this.statistic.args[0].length, 'to be', 1)
    expect(
      this.statistic.args[0][0],
      'to equal',
      JSON.stringify({
        message: 'Metric dump',
        context: {
          metrics: [
            {
              name: 'gauge',
              type: 'GAUGE',
              value: 4,
              labels: { brand: 'vw' },
              endTime: '2017-09-01T13:37:42.000Z'
            },
            {
              name: 'cumulative',
              type: 'CUMULATIVE',
              value: 20,
              labels: { brand: 'vw' },
              startTime: '2017-09-01T13:37:42.000Z',
              endTime: '2017-09-01T13:37:42.000Z'
            }
          ]
        },
        severity: 'STATISTIC',
        timestamp: '2017-09-01T13:37:42.000Z'
      })
    )
  })
})
