const expect = require('unexpected')
const { MetricRegistry } = require('./metric')
const sinon = require('sinon')

describe('src/metric.js', () => {
  beforeEach(() => {
    this.createKey = sinon.spy(MetricRegistry.prototype, 'createKey')
    this.clock = sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    this.metricRegistry = new MetricRegistry()
  })
  afterEach(async () => {
    this.clock.restore()
    this.createKey.restore()
  })

  it('creates cumulative metrics', async () => {
    let value = 10

    const name = 'my-metric'
    const labels = { brand: 'vw' }

    for (let i = 1; i <= 4; i++) {
      await this.metricRegistry.cumulative(name, value, labels)

      expect(
        { ...this.metricRegistry.metrics['my-metric:vw'], startTime: null },
        'to equal',
        {
          name: name,
          type: 'CUMULATIVE',
          value: value * i,
          labels: labels,
          startTime: null
        }
      )
    }

    expect(this.createKey.callCount, 'to be', 4)
    expect(this.createKey.args[0], 'to equal', [name, labels])
  })

  it('creates gauge metric', async () => {
    const name = 'gauge-metric'
    const key = 'gauge-metric:vw'
    const labels = { brand: 'vw' }
    await Promise.all(
      [50, 50, 0, 50].map(value =>
        this.metricRegistry.gauge(name, value, labels)
      )
    )

    expect(this.metricRegistry.metrics, 'to have key', key)
    expect(this.metricRegistry.metrics[key].value, 'to be', 50)

    await Promise.all(
      [20, 40, 80].map(value =>
        this.metricRegistry.gauge(name, value, { brand: 'foo' })
      )
    )

    const anotherKey = 'gauge-metric:foo'
    expect(this.metricRegistry.metrics, 'to have key', anotherKey)
    expect(this.metricRegistry.metrics[anotherKey].value, 'to be', 80)

    expect(this.createKey.callCount, 'to be', 7)
    expect(this.createKey.args[0], 'to equal', [name, labels])
  })

  it('dumps all metrics', async () => {
    this.metricRegistry.gauge('abc', 2, null)
    this.metricRegistry.gauge('foo', 4, { a: 'b' })

    const actualMetric = await this.metricRegistry.getMetrics()
    expect(actualMetric[0], 'to equal', {
      name: 'abc',
      type: 'GAUGE',
      value: 2,
      labels: null,
      startTime: 1504273062000,
      endTime: 1504273062000
    })
    expect(actualMetric[1], 'to equal', {
      name: 'foo',
      type: 'GAUGE',
      value: 4,
      labels: { a: 'b' },
      startTime: 1504273062000,
      endTime: 1504273062000
    })
  })

  it('creates the correct prometheus format', async () => {
    this.metricRegistry.gauge('abc', 2, null)
    this.metricRegistry.gauge('foo', 4, { brand: 'vw' })
    const actualMetric = await this.metricRegistry.getPrometheusMetrics()
    expect(actualMetric, 'to equal', ['abc 2', "foo{brand='vw'} 4"])
  })
})
