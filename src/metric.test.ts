/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EnvStub, TypedSinonStub } from '@connectedcars/test'
import sinon from 'sinon'

import { clearMetricRegistry, getMetricRegistry, MetricRegistry } from './metric'

describe('src/metric.js', () => {
  let env: EnvStub
  let clock: sinon.SinonFakeTimers
  let logStub: TypedSinonStub<typeof console.log>
  let errorStub: TypedSinonStub<typeof console.error>
  let metricRegistry: MetricRegistry
  beforeEach(() => {
    env = new EnvStub(['LOG_LEVEL'])
    clock = sinon.useFakeTimers(Date.parse('2017-09-01T13:37:42Z'))
    logStub = sinon.stub(console, 'log')
    errorStub = sinon.stub(console, 'error')
    metricRegistry = new MetricRegistry()

    process.env.LOG_LEVEL = 'STATISTIC'
  })
  afterEach(async () => {
    env.restore()
    sinon.restore()
    clearMetricRegistry()
  })

  describe('MetricRegistry', () => {
    it('creates cumulative metrics', () => {
      const value = 10

      const name = 'my-metric'
      const labels = { brand: 'vw' }

      for (let i = 1; i <= 4; i++) {
        metricRegistry.cumulative(name, value, labels)

        // @ts-ignore
        expect(metricRegistry.metrics['my-metric-brand:vw']).toEqual({
          name: name,
          type: 'CUMULATIVE',
          value: value * i,
          labels: labels,
          startTime: 1504273062000
        })
      }
    })

    it('creates cumulative metric and formats label', () => {
      const value = 10

      const name = 'my-metric'
      const labels = { release: 99 }

      for (let i = 1; i <= 4; i++) {
        metricRegistry.cumulative(name, value, labels)

        // @ts-ignore
        expect(metricRegistry.metrics['my-metric-release:99']).toEqual({
          name: name,
          type: 'CUMULATIVE',
          value: value * i,
          labels: { release: '99' },
          startTime: 1504273062000
        })
      }
    })

    it('creates gauge metric', () => {
      const name = 'gauge-metric'
      const key = 'gauge-metric-brand:vw'
      const labels = { brand: 'vw' }
      ;[50, 50, 0, 50].map(value => metricRegistry.gauge(name, value, labels))

      // @ts-ignore
      expect(metricRegistry.metrics).toHaveProperty(key)

      // @ts-ignore
      expect(metricRegistry.metrics[key]).toHaveProperty('endTime')
      // @ts-ignore
      expect(metricRegistry.metrics[key]).toEqual({
        name: 'gauge-metric',
        type: 'GAUGE',
        value: 50,
        labels: { brand: 'vw' },
        endTime: 1504273062000
      })
      ;[20, 40, 80].map(value => metricRegistry.gauge(name, value, { brand: 'foo' }))

      const anotherKey = 'gauge-metric-brand:foo'
      // @ts-ignore
      expect(metricRegistry.metrics).toHaveProperty(anotherKey)
      // @ts-ignore
      expect(metricRegistry.metrics[anotherKey]).toHaveProperty('endTime')
      // @ts-ignore
      expect(metricRegistry.metrics[anotherKey]).toEqual({
        name: 'gauge-metric',
        type: 'GAUGE',
        value: 80,
        labels: { brand: 'foo' },
        endTime: 1504273062000
      })
    })

    it('creates gauge metric with reducer function', () => {
      const fn = (arr: number[]) => arr.reduce((a, b) => a + b) / arr.length
      metricRegistry.gauge('baz', 20, undefined, fn)
      metricRegistry.gauge('baz', 30, undefined, fn)

      // @ts-ignore
      expect(metricRegistry.metrics['baz']).toEqual({
        value: [20, 30],
        name: 'baz',
        type: 'GAUGE',
        reducerFn: fn,
        labels: undefined
      })

      const metrics = metricRegistry.getMetrics()

      expect(metrics[0]).toEqual({
        value: 25,
        name: 'baz',
        type: 'GAUGE',
        labels: undefined,
        endTime: 1504273062000,
        reducerFn: fn
      })
    })

    it('gauge metric with reducer function should always have reducer, to avoid raceconditions', () => {
      const fn = (arr: number[]) => arr.reduce((a, b) => a + b) / arr.length
      metricRegistry.gauge('baz', 20, undefined, fn)
      metricRegistry.gauge('baz', 30, undefined)
      expect(errorStub.callCount).toEqual(1)
      expect(errorStub.args).toEqual([
        [
          '{"message":"Gauge with reducer called without reducer","context":{"name":"baz"},"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
        ]
      ])
    })

    it('gauge metric without reducer function should never have reducer, to avoid raceconditions', () => {
      const fn = (arr: number[]) => arr.reduce((a, b) => a + b) / arr.length
      metricRegistry.gauge('baz', 20, undefined)
      metricRegistry.gauge('baz', 30, undefined, fn)
      expect(errorStub.callCount).toEqual(1)
      expect(errorStub.args).toEqual([
        [
          '{"message":"Gauge without reducer called with reducer","context":{"name":"baz"},"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
        ]
      ])
    })

    it('can get a metric by name', () => {
      metricRegistry.gauge('bar', 20)
      metricRegistry.gauge('baz', 20)
      metricRegistry.gauge('baz', 30)

      // @ts-ignore
      expect(metricRegistry.metrics['baz']).toEqual({
        value: 30,
        name: 'baz',
        type: 'GAUGE',
        labels: undefined,
        endTime: 1504273062000
      })

      const metrics = metricRegistry.getMetric('baz')

      expect(metrics).toEqual([
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
      metricRegistry.gauge('bar', 20)
      metricRegistry.gauge('baz', 20, { label1: 'foo' })
      metricRegistry.gauge('baz', 30, { label2: 'foo' })
      metricRegistry.gauge('baz', 30, { label1: 'bar' })

      // @ts-ignore
      expect(metricRegistry.metrics).toEqual({
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

      const metrics = metricRegistry.getMetric('baz')

      expect(metrics).toEqual([
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
      metricRegistry.gauge('bar', 20)
      metricRegistry.gauge('baz', 20)
      metricRegistry.gauge('baz', 30)

      // @ts-ignore
      expect(metricRegistry.metrics['baz']).toEqual({
        value: 30,
        name: 'baz',
        type: 'GAUGE',
        labels: undefined,
        endTime: 1504273062000
      })

      const metrics = metricRegistry.getMetric('foo')

      expect(metrics).toEqual([])
    })

    it('can get a metric by name with reducer', () => {
      const fn = (arr: number[]) => arr.reduce((a, b) => a + b) / arr.length
      metricRegistry.gauge('bar', 20)
      metricRegistry.gauge('baz', 20, undefined, fn)
      metricRegistry.gauge('baz', 30, undefined, fn)
      metricRegistry.cumulative('foo', 20)
      metricRegistry.cumulative('foo', 5)

      // @ts-ignore
      expect(metricRegistry.metrics['baz']).toEqual({
        name: 'baz',
        type: 'GAUGE',
        value: [20, 30],
        labels: undefined,
        reducerFn: fn
      })

      const metrics = metricRegistry.getMetric('baz')

      expect(metrics).toEqual([
        {
          value: 25,
          name: 'baz',
          type: 'GAUGE',
          labels: undefined,
          endTime: 1504273062000
        }
      ])
    })

    it('can get a cumulative metric with time', () => {
      const fn = (arr: number[]) => arr.reduce((a, b) => a + b) / arr.length
      metricRegistry.gauge('bar', 20)
      metricRegistry.gauge('baz', 20, undefined, fn)
      metricRegistry.gauge('baz', 30, undefined, fn)
      metricRegistry.cumulative('foo', 20)
      metricRegistry.cumulative('foo', 5)

      // @ts-ignore
      expect(metricRegistry.metrics['foo']).toEqual({
        name: 'foo',
        type: 'CUMULATIVE',
        value: 25,
        labels: undefined,
        startTime: 1504273062000
      })

      const metrics = metricRegistry.getMetric('foo')

      expect(metrics).toEqual([
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
      metricRegistry.gauge('bar', 20)
      metricRegistry.gauge('baz', 20)
      metricRegistry.gauge('baz', 30)

      // @ts-ignore
      expect(metricRegistry.metrics['baz']).toEqual({
        value: 30,
        name: 'baz',
        type: 'GAUGE',
        labels: undefined,
        endTime: 1504273062000
      })

      metricRegistry.clearMetric('baz')
      const metrics = metricRegistry.getMetrics()

      expect(metrics).toEqual([
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
      metricRegistry.gauge('bar', 20, { label1: 'foo' })
      metricRegistry.gauge('baz', 20, { label2: 'bar' })
      metricRegistry.gauge('baz', 30, { label1: 'foo' })

      // @ts-ignore
      expect(metricRegistry.metrics).toEqual({
        'bar-label1:foo': { name: 'bar', type: 'GAUGE', value: 20, labels: { label1: 'foo' } },
        'baz-label2:bar': { name: 'baz', type: 'GAUGE', value: 20, labels: { label2: 'bar' } },
        'baz-label1:foo': { name: 'baz', type: 'GAUGE', value: 30, labels: { label1: 'foo' } }
      })

      metricRegistry.clearMetric('baz')
      const metrics = metricRegistry.getMetrics()

      expect(metrics).toEqual([
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
      metricRegistry.gauge('bar', 20)
      metricRegistry.gauge('baz', 20)
      metricRegistry.gauge('baz', 30)

      // @ts-ignore
      expect(metricRegistry.metrics['baz']).toEqual({
        value: 30,
        name: 'baz',
        type: 'GAUGE',
        labels: undefined,
        endTime: 1504273062000
      })

      const metrics = metricRegistry.getMetricNames().sort((a, b) => a.localeCompare(b))

      expect(metrics).toEqual(['bar', 'baz'])
    })

    it('dumps all metrics', () => {
      metricRegistry.gauge('abc', 2)
      metricRegistry.gauge('abc', 2)
      metricRegistry.gauge('foo', 4, { a: 'b' })
      metricRegistry.cumulative('baz', 1)

      const actualMetric = metricRegistry.getMetrics()

      expect(actualMetric).toEqual([
        {
          name: 'abc',
          type: 'GAUGE',
          value: 2,
          labels: undefined,
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
          labels: undefined,
          startTime: 1504273062000,
          endTime: 1504273062000
        }
      ])
    })

    it('logs all metrics', () => {
      metricRegistry.gauge('gauge', 4, { brand: 'vw' })
      metricRegistry.cumulative('cumulative', 20, { brand: 'vw' })
      metricRegistry.logMetrics()

      expect(logStub.callCount).toEqual(2)
      expect(logStub.args[0].length).toEqual(1)
      expect(logStub.args[0][0]).toEqual(
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

      expect(logStub.args[1][0]).toEqual(
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
      // @ts-ignore
      expect(metricRegistry.metrics).toEqual({})
    })

    it('logs metrics in batches of 250', () => {
      for (let i = 0; i < 600; i++) {
        metricRegistry.gauge('gauge', 4, { brand: `vw${i}` })
      }
      metricRegistry.logMetrics()

      expect(logStub.callCount).toEqual(3)
      expect(logStub.args[0][0]).toMatch(/vw0/)
      expect(logStub.args[0][0]).toMatch(/vw249/)
      expect(logStub.args[1][0]).toMatch(/vw250/)
      expect(logStub.args[1][0]).toMatch(/vw499/)
      expect(logStub.args[2][0]).toMatch(/vw500/)
      expect(logStub.args[2][0]).toMatch(/vw599/)

      // @ts-ignore
      expect(metricRegistry.metrics).toEqual({})
    })

    it('groups metrics by name', () => {
      metricRegistry.gauge('foo-metric', 4, { brand: 'vw' })
      metricRegistry.gauge('foo-metric', 2, { brand: 'seat' })
      metricRegistry.gauge('bar-metric', 20, { brand: 'vw' })
      metricRegistry.logMetrics()

      expect(logStub.callCount).toEqual(2)
      expect(logStub.args[0].length).toEqual(1)
      expect(logStub.args[0][0]).toEqual(
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

      expect(logStub.args[1][0]).toEqual(
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

    it('emits metrics', () => {
      // Add an event listener to the metricRegistry
      const dumpedMetrics: any[] = []
      metricRegistry.on('foo-metric', metricDump => {
        dumpedMetrics.push(...metricDump.metrics)
      })
      metricRegistry.on('bar-metric', metricDump => {
        dumpedMetrics.push(...metricDump.metrics)
      })

      metricRegistry.gauge('foo-metric', 4, { brand: 'vw' })
      metricRegistry.gauge('foo-metric', 2, { brand: 'seat' })
      metricRegistry.gauge('bar-metric', 20, { brand: 'vw' })
      metricRegistry.logMetrics()

      expect(logStub.callCount).toEqual(2)
      expect(logStub.args[0].length).toEqual(1)
      expect(logStub.args[0][0]).toEqual(
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

      expect(logStub.args[1][0]).toEqual(
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

      expect(dumpedMetrics).toEqual([
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
        },
        {
          name: 'bar-metric',
          type: 'GAUGE',
          value: 20,
          labels: { brand: 'vw' },
          endTime: '2017-09-01T13:37:42.000Z'
        }
      ])
    })

    it('cumulative handles name collision', () => {
      metricRegistry.gauge('foo-metric', 4, { brand: 'vw' })
      metricRegistry.cumulative('foo-metric', 20, { brand: 'vw' })
      metricRegistry.logMetrics()

      expect(errorStub.callCount).toEqual(1)
      expect(errorStub.args).toEqual([
        [
          '{"message":"Cannot add cumulative with same name as existing gauge","context":{"name":"foo-metric","value":20,"labels":{"brand":"vw"}},"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
        ]
      ])
      expect(logStub.callCount).toEqual(1)
      expect(logStub.args[0].length).toEqual(1)
      expect(logStub.args[0][0]).toEqual(
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
      metricRegistry.cumulative('foo-metric', 20, { brand: 'vw' })
      metricRegistry.gauge('foo-metric', 4, { brand: 'vw' })
      metricRegistry.logMetrics()

      expect(errorStub.callCount).toEqual(1)
      expect(errorStub.args).toEqual([
        [
          '{"message":"Cannot add gauge with same name as existing cumulative","context":{"name":"foo-metric","value":4,"labels":{"brand":"vw"}},"severity":"ERROR","timestamp":"2017-09-01T13:37:42.000Z"}'
        ]
      ])
      expect(logStub.callCount).toEqual(1)
      expect(logStub.args[0].length).toEqual(1)
      expect(logStub.args[0][0]).toEqual(
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
      metricRegistry.gauge('gauge', 4, { brand: 'vw' })
      metricRegistry.gauge('gauge', 5, { brand: 'vw' })
      clock.tick(24 * 60 * 60 * 1000 + 1)
      metricRegistry.cumulative('cumulative', 20, { brand: 'vw' })
      metricRegistry.logMetrics()

      expect(logStub.callCount).toEqual(1)
      expect(logStub.args[0].length).toEqual(1)
      expect(logStub.args[0][0]).toEqual(
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
    let logMetricsStub: TypedSinonStub<typeof MetricRegistry.prototype.logMetrics>
    beforeEach(() => {
      logMetricsStub = sinon.stub(MetricRegistry.prototype, 'logMetrics').returns()
    })
    afterEach(() => {
      clock.restore()
    })

    it('calls logMetrics on an interval', async () => {
      clearMetricRegistry()
      const registry = getMetricRegistry(10000)
      clock.tick(10000)
      // @ts-ignore
      expect(registry.metrics).toEqual({})
      expect(logMetricsStub.callCount).toEqual(2)
      expect(logMetricsStub.args[0]).toEqual([])
      expect(logMetricsStub.args[1]).toEqual([])
    })

    it('calls logMetrics using default settings', async () => {
      // Calling the function 2 times should have no impact
      getMetricRegistry()

      const registry = getMetricRegistry(undefined)
      clock.tick(120 * 1000)
      // @ts-ignore
      expect(registry.metrics).toEqual({})
      expect(logMetricsStub.callCount).toEqual(3)
      expect(logMetricsStub.args[0]).toEqual([])
      expect(logMetricsStub.args[1]).toEqual([])
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
