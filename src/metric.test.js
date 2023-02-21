const expect = require('unexpected')
const { MetricRegistry, clearMetricRegistry, getMetricRegistry } = require('./metric')
const sinon = require('sinon')

describe('src/metric.js', () => {
  beforeEach(() => {
    this.createKey = sinon.spy(MetricRegistry.prototype, 'createKey')
    this.clock = sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    this.log = sinon.stub(console, 'log')
    this.error = sinon.stub(console, 'error')
    this.metricRegistry = new MetricRegistry()

    process.env.LOG_LEVEL = 'STATISTIC'
  })
  afterEach(async () => {
    sinon.restore()
    clearMetricRegistry()
  })

  describe('MetricRegistry', () => {
    it('creates cumulative metrics', () => {
      let value = 10

      const name = 'my-metric'
      const labels = { brand: 'vw' }

      for (let i = 1; i <= 4; i++) {
        this.metricRegistry.cumulative(name, value, labels)

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

    it('creates cumulative metric and formats label', () => {
      let value = 10

      const name = 'my-metric'
      const labels = { release: 99 }

      for (let i = 1; i <= 4; i++) {
        this.metricRegistry.cumulative(name, value, labels)

        expect(this.metricRegistry.metrics['my-metric-release:99'], 'to equal', {
          name: name,
          type: 'CUMULATIVE',
          value: value * i,
          labels: { release: '99' },
          startTime: 1504273062000
        })
      }

      expect(this.createKey.callCount, 'to be', 4)
      expect(this.createKey.args[0], 'to equal', [name, labels])
    })

    it('creates gauge metric', () => {
      const name = 'gauge-metric'
      const key = 'gauge-metric-brand:vw'
      const labels = { brand: 'vw' }
      ;[50, 50, 0, 50].map(value => this.metricRegistry.gauge(name, value, labels))

      expect(this.metricRegistry.metrics, 'to have key', key)

      expect(this.metricRegistry.metrics[key], 'to have key', 'endTime')
      expect(this.metricRegistry.metrics[key], 'to equal', {
        name: 'gauge-metric',
        type: 'GAUGE',
        value: 50,
        labels: { brand: 'vw' },
        endTime: 1504273062000
      })
      ;[20, 40, 80].map(value => this.metricRegistry.gauge(name, value, { brand: 'foo' }))

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

    it('creates gauge metric with reducer function', () => {
      const fn = arr => arr.reduce((a, b) => a + b) / arr.length
      this.metricRegistry.gauge('baz', 20, null, fn)
      this.metricRegistry.gauge('baz', 30, null, fn)

      expect(this.metricRegistry.metrics['baz'], 'to equal', {
        value: [20, 30],
        name: 'baz',
        type: 'GAUGE',
        reducerFn: fn,
        labels: null
      })

      const metrics = this.metricRegistry.getMetrics()

      expect(metrics[0], 'to equal', {
        value: 25,
        name: 'baz',
        type: 'GAUGE',
        labels: null,
        endTime: 1504273062000,
        reducerFn: fn
      })
    })

    it('gauge metric with reducer function should always have reducer, to avoid raceconditions', () => {
      const fn = arr => arr.reduce((a, b) => a + b) / arr.length
      this.metricRegistry.gauge('baz', 20, null, fn)
      this.metricRegistry.gauge('baz', 30, null)
      expect(this.error.callCount, 'to equal', 1)
      expect(this.error.args, 'to equal', [
        [
          '{"message":"Gauge with reducer called without reducer","context":{"name":"baz"},"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
        ]
      ])
    })

    it('gauge metric without reducer function should never have reducer, to avoid raceconditions', () => {
      const fn = arr => arr.reduce((a, b) => a + b) / arr.length
      this.metricRegistry.gauge('baz', 20, null)
      this.metricRegistry.gauge('baz', 30, null, fn)
      expect(this.error.callCount, 'to equal', 1)
      expect(this.error.args, 'to equal', [
        [
          '{"message":"Gauge without reducer called with reducer","context":{"name":"baz"},"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
        ]
      ])
    })

    it('can get a metric by name', () => {
      this.metricRegistry.gauge('bar', 20)
      this.metricRegistry.gauge('baz', 20)
      this.metricRegistry.gauge('baz', 30)

      expect(this.metricRegistry.metrics['baz'], 'to equal', {
        value: 30,
        name: 'baz',
        type: 'GAUGE',
        labels: undefined,
        endTime: 1504273062000
      })

      const metrics = this.metricRegistry.getMetric('baz')

      expect(metrics, 'to equal', [
        {
          value: 30,
          name: 'baz',
          type: 'GAUGE',
          labels: undefined,
          endTime: 1504273062000
        }
      ])
    })

    it('can get a metric by name with labels', () => {
      this.metricRegistry.gauge('bar', 20)
      this.metricRegistry.gauge('baz', 20, { label1: 'foo' })
      this.metricRegistry.gauge('baz', 30, { label2: 'foo' })
      this.metricRegistry.gauge('baz', 30, { label1: 'bar' })

      expect(this.metricRegistry.metrics, 'to equal', {
        bar: {
          name: 'bar',
          type: 'GAUGE',
          value: 20,
          labels: undefined
        },
        'baz-label1:foo': {
          name: 'baz',
          type: 'GAUGE',
          value: 20,
          labels: {
            label1: 'foo'
          }
        },
        'baz-label2:foo': {
          name: 'baz',
          type: 'GAUGE',
          value: 30,
          labels: {
            label2: 'foo'
          }
        },
        'baz-label1:bar': {
          name: 'baz',
          type: 'GAUGE',
          value: 30,
          labels: {
            label1: 'bar'
          }
        }
      })

      const metrics = this.metricRegistry.getMetric('baz')

      expect(metrics, 'to equal', [
        {
          name: 'baz',
          type: 'GAUGE',
          value: 20,
          labels: { label1: 'foo' },
          endTime: 1504273062000
        },
        {
          name: 'baz',
          type: 'GAUGE',
          value: 30,
          labels: { label2: 'foo' },
          endTime: 1504273062000
        },
        {
          name: 'baz',
          type: 'GAUGE',
          value: 30,
          labels: { label1: 'bar' },
          endTime: 1504273062000
        }
      ])
    })

    it('can get a nonexisting metric by name', () => {
      this.metricRegistry.gauge('bar', 20)
      this.metricRegistry.gauge('baz', 20)
      this.metricRegistry.gauge('baz', 30)

      expect(this.metricRegistry.metrics['baz'], 'to equal', {
        value: 30,
        name: 'baz',
        type: 'GAUGE',
        labels: undefined,
        endTime: 1504273062000
      })

      const metrics = this.metricRegistry.getMetric('foo')

      expect(metrics, 'to equal', [])
    })

    it('can get a metric by name with reducer', () => {
      const fn = arr => arr.reduce((a, b) => a + b) / arr.length
      this.metricRegistry.gauge('bar', 20)
      this.metricRegistry.gauge('baz', 20, null, fn)
      this.metricRegistry.gauge('baz', 30, null, fn)
      this.metricRegistry.cumulative('foo', 20)
      this.metricRegistry.cumulative('foo', 5)

      expect(this.metricRegistry.metrics['baz'], 'to equal', {
        name: 'baz',
        type: 'GAUGE',
        value: [20, 30],
        labels: null,
        reducerFn: fn
      })

      const metrics = this.metricRegistry.getMetric('baz')

      expect(metrics, 'to equal', [
        {
          value: 25,
          name: 'baz',
          type: 'GAUGE',
          labels: null,
          endTime: 1504273062000
        }
      ])
    })

    it('can get a cumulative metric with time', () => {
      const fn = arr => arr.reduce((a, b) => a + b) / arr.length
      this.metricRegistry.gauge('bar', 20)
      this.metricRegistry.gauge('baz', 20, null, fn)
      this.metricRegistry.gauge('baz', 30, null, fn)
      this.metricRegistry.cumulative('foo', 20)
      this.metricRegistry.cumulative('foo', 5)

      expect(this.metricRegistry.metrics['foo'], 'to equal', {
        name: 'foo',
        type: 'CUMULATIVE',
        value: 25,
        labels: undefined,
        startTime: 1504273062000
      })

      const metrics = this.metricRegistry.getMetric('foo')

      expect(metrics, 'to equal', [
        {
          name: 'foo',
          type: 'CUMULATIVE',
          value: 25,
          labels: undefined,
          startTime: 1504273062000,
          endTime: 1504273062000
        }
      ])
    })

    it('can clear a metric by name', () => {
      this.metricRegistry.gauge('bar', 20)
      this.metricRegistry.gauge('baz', 20)
      this.metricRegistry.gauge('baz', 30)

      expect(this.metricRegistry.metrics['baz'], 'to equal', {
        value: 30,
        name: 'baz',
        type: 'GAUGE',
        labels: undefined,
        endTime: 1504273062000
      })

      this.metricRegistry.clearMetric('baz')
      const metrics = this.metricRegistry.getMetrics()

      expect(metrics, 'to equal', [
        {
          value: 20,
          name: 'bar',
          type: 'GAUGE',
          labels: undefined,
          endTime: 1504273062000
        }
      ])
    })

    it('can clear a metric by name with labels', () => {
      this.metricRegistry.gauge('bar', 20, { label1: 'foo' })
      this.metricRegistry.gauge('baz', 20, { label2: 'bar' })
      this.metricRegistry.gauge('baz', 30, { label1: 'foo' })

      expect(this.metricRegistry.metrics, 'to equal', {
        'bar-label1:foo': { name: 'bar', type: 'GAUGE', value: 20, labels: { label1: 'foo' } },
        'baz-label2:bar': { name: 'baz', type: 'GAUGE', value: 20, labels: { label2: 'bar' } },
        'baz-label1:foo': { name: 'baz', type: 'GAUGE', value: 30, labels: { label1: 'foo' } }
      })

      this.metricRegistry.clearMetric('baz')
      const metrics = this.metricRegistry.getMetrics()

      expect(metrics, 'to equal', [
        {
          name: 'bar',
          type: 'GAUGE',
          value: 20,
          labels: { label1: 'foo' },
          endTime: 1504273062000
        }
      ])
    })

    it('can get metric names', () => {
      this.metricRegistry.gauge('bar', 20)
      this.metricRegistry.gauge('baz', 20)
      this.metricRegistry.gauge('baz', 30)

      expect(this.metricRegistry.metrics['baz'], 'to equal', {
        value: 30,
        name: 'baz',
        type: 'GAUGE',
        labels: undefined,
        endTime: 1504273062000
      })

      const metrics = this.metricRegistry.getMetricNames().sort((a, b) => a.localeCompare(b))

      expect(metrics, 'to equal', ['bar', 'baz'])
    })

    it('fails calling gauge for unknown reasons and ignores it gracefully', () => {
      this.createKey.restore()
      sinon.stub(this.metricRegistry, 'createKey').throws(new Error('Something occurred'))
      this.metricRegistry.gauge('baz', 20, null)
    })

    it('fails calling cumulative for unknown reasons and ignores it gracefully', () => {
      this.createKey.restore()
      sinon.stub(this.metricRegistry, 'createKey').throws(new Error('Something occurred'))
      this.metricRegistry.cumulative('baz', 20, null)
    })

    it('dumps all metrics', () => {
      this.metricRegistry.gauge('abc', 2, null)
      this.metricRegistry.gauge('abc', 2, null)
      this.metricRegistry.gauge('foo', 4, { a: 'b' })
      this.metricRegistry.cumulative('baz', 1, null)

      const actualMetric = this.metricRegistry.getMetrics()

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

    it('creates the correct prometheus format', () => {
      this.metricRegistry.gauge('abc', 2, null)
      this.metricRegistry.gauge('foo', 4, { brand: 'vw' })
      this.metricRegistry.cumulative('baz', 8, { model: 'touran' })
      const actualMetric = this.metricRegistry.getPrometheusMetrics()
      expect(actualMetric, 'to equal', ['abc 2', "foo{brand='vw'} 4", "baz{model='touran'} 8 1504273062000"])
    })

    it('metric key is constructed correctly', () => {
      const key = this.metricRegistry.createKey('name', { a: 'b' })
      expect(key, 'to equal', 'name-a:b')
    })

    it('logs all metrics', () => {
      this.metricRegistry.gauge('gauge', 4, { brand: 'vw' })
      this.metricRegistry.cumulative('cumulative', 20, { brand: 'vw' })
      this.metricRegistry.logMetrics()

      expect(this.log.callCount, 'to be', 2)
      expect(this.log.args[0].length, 'to be', 1)
      expect(
        this.log.args[0][0],
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
              }
            ]
          },
          severity: 'STATISTIC',
          timestamp: '2017-09-01T13:37:42.000Z'
        })
      )

      expect(
        this.log.args[1][0],
        'to equal',
        JSON.stringify({
          message: 'Metric dump',
          context: {
            metrics: [
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
      expect(this.metricRegistry.metrics, 'to equal', {})
    })

    it('logs metrics in batches of 500', () => {
      for (let i = 0; i < 1100; i++) {
        this.metricRegistry.gauge('gauge', 4, { brand: `vw${i}` })
      }
      this.metricRegistry.logMetrics()

      expect(this.log.callCount, 'to be', 3)
      expect(this.log.args[0][0], 'to match', /vw0/)
      expect(this.log.args[0][0], 'to match', /vw499/)
      expect(this.log.args[1][0], 'to match', /vw500/)
      expect(this.log.args[1][0], 'to match', /vw999/)
      expect(this.log.args[2][0], 'to match', /vw1000/)
      expect(this.log.args[2][0], 'to match', /vw1099/)

      expect(this.metricRegistry.metrics, 'to equal', {})
    })

    it('groups metrics by name', () => {
      this.metricRegistry.gauge('foo-metric', 4, { brand: 'vw' })
      this.metricRegistry.gauge('foo-metric', 2, { brand: 'seat' })
      this.metricRegistry.gauge('bar-metric', 20, { brand: 'vw' })
      this.metricRegistry.logMetrics()

      expect(this.log.callCount, 'to be', 2)
      expect(this.log.args[0].length, 'to be', 1)
      expect(
        this.log.args[0][0],
        'to equal',
        JSON.stringify({
          message: 'Metric dump',
          context: {
            metrics: [
              {
                name: 'foo-metric',
                type: 'GAUGE',
                value: 4,
                labels: { brand: 'vw' },
                endTime: '2017-09-01T13:37:42.000Z'
              },
              {
                name: 'foo-metric',
                type: 'GAUGE',
                value: 2,
                labels: { brand: 'seat' },
                endTime: '2017-09-01T13:37:42.000Z'
              }
            ]
          },
          severity: 'STATISTIC',
          timestamp: '2017-09-01T13:37:42.000Z'
        })
      )

      expect(
        this.log.args[1][0],
        'to equal',
        JSON.stringify({
          message: 'Metric dump',
          context: {
            metrics: [
              {
                name: 'bar-metric',
                type: 'GAUGE',
                value: 20,
                labels: { brand: 'vw' },
                endTime: '2017-09-01T13:37:42.000Z'
              }
            ]
          },
          severity: 'STATISTIC',
          timestamp: '2017-09-01T13:37:42.000Z'
        })
      )
    })

    it('cumulative handles name collision', () => {
      this.metricRegistry.gauge('foo-metric', 4, { brand: 'vw' })
      this.metricRegistry.cumulative('foo-metric', 20, { brand: 'vw' })
      this.metricRegistry.logMetrics()

      expect(this.error.callCount, 'to be', 1)
      expect(this.error.args, 'to equal', [
        [
          '{"message":"Cannot add cumulative with same name as existing gauge","context":{"name":"foo-metric","value":20,"labels":{"brand":"vw"}},"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
        ]
      ])
      expect(this.log.callCount, 'to be', 1)
      expect(this.log.args[0].length, 'to be', 1)
      expect(
        this.log.args[0][0],
        'to equal',
        JSON.stringify({
          message: 'Metric dump',
          context: {
            metrics: [
              {
                name: 'foo-metric',
                type: 'GAUGE',
                value: 24,
                labels: { brand: 'vw' },
                endTime: '2017-09-01T13:37:42.000Z'
              }
            ]
          },
          severity: 'STATISTIC',
          timestamp: '2017-09-01T13:37:42.000Z'
        })
      )
    })

    it('gauge handles name collision', () => {
      this.metricRegistry.cumulative('foo-metric', 20, { brand: 'vw' })
      this.metricRegistry.gauge('foo-metric', 4, { brand: 'vw' })
      this.metricRegistry.logMetrics()

      expect(this.error.callCount, 'to be', 1)
      expect(this.error.args, 'to equal', [
        [
          '{"message":"Cannot add gauge with same name as existing cumulative","context":{"name":"foo-metric","value":4,"labels":{"brand":"vw"}},"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
        ]
      ])
      expect(this.log.callCount, 'to be', 1)
      expect(this.log.args[0].length, 'to be', 1)
      expect(
        this.log.args[0][0],
        'to equal',
        JSON.stringify({
          message: 'Metric dump',
          context: {
            metrics: [
              {
                name: 'foo-metric',
                type: 'CUMULATIVE',
                value: 4,
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

    it('does not log old metrics', () => {
      this.metricRegistry.gauge('gauge', 4, { brand: 'vw' })
      this.metricRegistry.gauge('gauge', 5, { brand: 'vw' })
      this.clock.tick(24 * 60 * 60 * 1000 + 1)
      this.metricRegistry.cumulative('cumulative', 20, { brand: 'vw' })
      this.metricRegistry.logMetrics()

      expect(this.log.callCount, 'to be', 1)
      expect(this.log.args[0].length, 'to be', 1)
      expect(
        this.log.args[0][0],
        'to equal',
        JSON.stringify({
          message: 'Metric dump',
          context: {
            metrics: [
              {
                name: 'cumulative',
                type: 'CUMULATIVE',
                value: 20,
                labels: { brand: 'vw' },
                startTime: '2017-09-02T13:37:42.001Z',
                endTime: '2017-09-02T13:37:42.001Z'
              }
            ]
          },
          severity: 'STATISTIC',
          timestamp: '2017-09-02T13:37:42.001Z'
        })
      )
    })
  })

  describe('getMetricRegistry', () => {
    beforeEach(() => {
      this.logMetrics = sinon.stub(MetricRegistry.prototype, 'logMetrics').returns()
    })
    afterEach(() => {
      this.clock.restore()
    })
    it('calls logMetrics on an interval', async () => {
      clearMetricRegistry()
      const registry = getMetricRegistry(10000)
      this.clock.tick(10000)
      expect(registry.metrics, 'to equal', {})
      expect(this.logMetrics.callCount, 'to be', 2)
      expect(this.logMetrics.args[0], 'to equal', [])
      expect(this.logMetrics.args[1], 'to equal', [])
    })

    it('calls logMetrics using default settings', async () => {
      // Calling the function 2 times should have no impact
      getMetricRegistry()

      const registry = getMetricRegistry(undefined)
      this.clock.tick(120 * 1000)
      expect(registry.metrics, 'to equal', {})
      expect(this.logMetrics.callCount, 'to be', 3)
      expect(this.logMetrics.args[0], 'to equal', [])
      expect(this.logMetrics.args[1], 'to equal', [])
    })

    it('can clear metrics without a timeout set', async () => {
      clearMetricRegistry()
      clearMetricRegistry()
      getMetricRegistry(-1)
      clearMetricRegistry()
      clearMetricRegistry()
    })
  })
})
