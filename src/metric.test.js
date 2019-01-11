const expect = require('unexpected')
const metric = require('./metric')

describe('src/metric.js', () => {
  beforeEach(() => {})
  afterEach(async () => {})

  it('creates cumulative metrics', async () => {
    let value = 10

    const name = 'my-metric'
    const labels = { brand: 'vw' }

    for (let i = 1; i < 4; i++) {
      await metric.cumulative(name, value, labels)

      expect(
        { ...metric.metrics['my-metric:vw'], startTime: null },
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
  })

  it('creates gauge metric', async () => {
    const name = 'gauge-metric'
    const key = 'gauge-metric:vw'
    const labels = { brand: 'vw' }
    await Promise.all(
      [50, 50, 0, 50].map(value => metric.gauge(name, value, labels))
    )

    expect(metric.metrics, 'to have key', key)
    expect(metric.metrics[key].value, 'to be', 50)

    await Promise.all(
      [20, 40, 80].map(value => metric.gauge(name, value, { brand: 'foo' }))
    )

    const anotherKey = 'gauge-metric:foo'
    expect(metric.metrics, 'to have key', anotherKey)
    expect(metric.metrics[anotherKey].value, 'to be', 80)
  })

  it('dumps all metrics', async () => {
    const name = 'abc'

    const key = 'abc'
    const labels = null
    const value = 2
    metric.gauge(name, value, labels)

    const actualMetric = (await metric.getMetrics()).filter(
      m => m.name === key && m.labels === labels
    )[0]
    expect(actualMetric, 'to only have keys', [
      'name',
      'value',
      'labels',
      'startTime',
      'endTime',
      'type'
    ])
  })
})
