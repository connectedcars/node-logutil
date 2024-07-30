import { EventEmitter } from 'events'

import { error } from './error'
import { statistic } from './statistic'

export enum MetricType {
  GAUGE = 'GAUGE',
  CUMULATIVE = 'CUMULATIVE'
}

interface BaseMetric {
  name: string
  labels?: Record<string, unknown>
  startTime?: number
  endTime?: number
}
type ReducerFn = (arr: number[]) => number
interface GaugeMetric extends BaseMetric {
  type: MetricType.GAUGE
  value: number | number[]
  reducerFn?: ReducerFn
}
interface CumulativeMetric extends BaseMetric {
  type: MetricType.CUMULATIVE
  value: number
  startTime: number
}
type Metric = GaugeMetric | CumulativeMetric
type FilteredMetric = Omit<Metric, 'value'> & { value: number; endTime: number }
type FormattedMetric = Omit<Metric, 'startTime' | 'endTime'> & { startTime?: string; endTime: string }

type MetricsEvent = { metrics: FormattedMetric[] }

function isGaugeMetric(metric: Metric): metric is GaugeMetric {
  return metric.type === MetricType.GAUGE
}
function isCumulativeMetric(metric: Metric): metric is CumulativeMetric {
  return metric.type === MetricType.CUMULATIVE
}

export class MetricRegistry extends EventEmitter<{
  [metricName: string]: [MetricsEvent]
}> {
  private metrics: Record<string, Metric> = {}

  public logMetrics(): void {
    const metrics = this.getMetrics()
    const result: Record<string, FormattedMetric[]> = {}

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

    for (const [metricName, metrics] of Object.entries(result)) {
      // Emit each metric name as separate event
      this.emit(metricName, {
        metrics
      })
    }

    for (const metrics of Object.values(result)) {
      while (metrics.length > 0) {
        const metricsBatch = metrics.splice(0, 250)
        statistic('Metric dump', {
          metrics: metricsBatch
        })
      }
    }
    // After dumping and emmiting metrics, remove all existing metrics
    // We don't miss out on any metrics here, because this code is purely synchronous
    this.metrics = {}
  }
  public getMetrics(): FilteredMetric[] {
    const result: FilteredMetric[] = []

    for (const key of Object.keys(this.metrics)) {
      const metric = { ...this.metrics[key] }
      metric.endTime = metric.endTime ? metric.endTime : Date.now()

      if (isGaugeMetric(metric) && metric.reducerFn) {
        metric.value = metric.reducerFn(metric.value as number[])
      }

      result.push(metric as FilteredMetric)
    }

    return result
  }

  public gauge(
    name: string,
    value: number,
    labels?: Record<string, unknown>,
    reducerFn: ReducerFn | null = null
  ): void {
    try {
      this.formatLabels(labels)
      const key = this.createKey(name, labels)
      let metric = this.metrics[key]

      if (!metric) {
        metric = this.metrics[key] = {
          name: name,
          type: MetricType.GAUGE,
          value: reducerFn ? [value] : value,
          labels: labels
        }
        if (reducerFn) {
          metric.reducerFn = reducerFn
        }
      } else {
        if (!isGaugeMetric(metric)) {
          error('Cannot add gauge with same name as existing cumulative', { name, value, labels })
        }
        if (isGaugeMetric(metric) && metric.reducerFn) {
          if (!reducerFn) {
            error('Gauge with reducer called without reducer', { name })
          }
          ;(metric.value as number[]).push(value)
        } else {
          if (reducerFn) {
            error('Gauge without reducer called with reducer', {
              name
            })
          }
          metric.value = value
          metric.endTime = Date.now()
        }
      }
    } catch (e) {
      error('Failed logging metric', {
        message: e.message,
        stack: e.stack
      })
    }
  }
  public cumulative(name: string, value: number, labels?: Record<string, unknown>): void {
    try {
      this.formatLabels(labels)
      const key = this.createKey(name, labels)

      if (!this.metrics[key]) {
        this.metrics[key] = {
          name: name,
          type: MetricType.CUMULATIVE,
          value: 0,
          labels: labels,
          startTime: Date.now()
        }
      }
      const metric = this.metrics[key]
      if (!isCumulativeMetric(metric)) {
        error('Cannot add cumulative with same name as existing gauge', { name, value, labels })
      }
      if (typeof metric.value === 'number') {
        metric.value += value
      }
    } catch (e) {
      error('Failed logging metric', {
        message: e.message,
        stack: e.stack
      })
    }
  }

  public getMetric(name: string): FilteredMetric[] {
    const metrics = Object.values(this.metrics).filter(m => m.name === name)

    if (metrics.length === 0) {
      return []
    }

    const res = []
    for (const metric of metrics) {
      const value =
        isGaugeMetric(metric) && metric.reducerFn
          ? metric.reducerFn(metric.value as number[])
          : (metric.value as number)
      const filteredMetric: FilteredMetric = {
        name: metric.name,
        type: metric.type,
        value,
        labels: metric.labels,
        endTime: metric.endTime ? metric.endTime : Date.now()
      }
      if (filteredMetric.type === MetricType.CUMULATIVE) {
        filteredMetric.startTime = metric.startTime
      }
      res.push(filteredMetric)
    }
    return res as FilteredMetric[]
  }

  public clearMetric(name: string): void {
    const metrics = Object.keys(this.metrics).filter(key => this.metrics[key].name === name)
    for (const metricName of metrics) {
      delete this.metrics[metricName]
    }
  }

  public getMetricNames(): string[] {
    return Object.keys(this.metrics)
  }

  private convertTimestampToIsoString(metric: FilteredMetric | FormattedMetric): FormattedMetric {
    if (metric.startTime) {
      metric.startTime = new Date(metric.startTime).toISOString()
    }
    metric.endTime = new Date(metric.endTime).toISOString()
    return metric as FormattedMetric
  }
  private createKey(name: string, labels?: Record<string, unknown>): string {
    if (labels) {
      const labelKey = Object.keys(labels)
        .map(k => [k, labels[k]].join(':'))
        .join(':')
      return [name, labelKey].join('-')
    }

    return name
  }
  private formatLabels(labels?: Record<string, unknown>): void {
    if (!labels) {
      return
    }
    for (const [key, value] of Object.entries(labels)) {
      labels[key] = String(value)
    }
  }
}

let metricRegistry: MetricRegistry | null = null
let scrapeInterval: NodeJS.Timeout

function logMetrics(delay: number): void {
  if (!metricRegistry) {
    metricRegistry = new MetricRegistry()
  }
  if (delay > -1) {
    metricRegistry.logMetrics()
    scrapeInterval = setTimeout(() => logMetrics(delay), delay)
  }
}
export function getMetricRegistry(delay = 60 * 1000): MetricRegistry {
  if (!metricRegistry) {
    metricRegistry = new MetricRegistry()
    logMetrics(delay)
  }
  return metricRegistry
}

export function clearMetricRegistry(): void {
  if (scrapeInterval) {
    clearTimeout(scrapeInterval)
  }
  metricRegistry?.removeAllListeners()
  metricRegistry = null
}
