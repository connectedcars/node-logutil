export function debug(...args: any[]): void
export function statistic(...args: any[]): void
export function info(...args: any[]): void
export function warn(...args: any[]): void
export function error(...args: any[]): void
export function critical(...args: any[]): void

export type MetricLabels = { [key: string]: string } | undefined

export interface GaugeMetric<K extends string> {
  name: K,
  type: 'GAUGE',
  value: number,
  endTime: number //UnixTime
  labels: MetricLabels
}
export interface CumulativeMetric<K extends string> {
  name: K,
  type: 'CUMULATIVE',
  value: number,
  labels: MetricLabels
  startTime: number //UnixTime
  endTime: number //UnixTime
}

type Metrics<K extends string> = GaugeMetric<K> | CumulativeMetric<K>

export class MetricRegistry {
  public gauge(name: string, value: number, labels?: MetricLabels, reducerFn?: (values: number[]) => number ): void
  cumulative(name: string, value: number, labels?: MetricLabels): void
  logMetrics(): void
  getMetric<K extends string>(name: K): Metrics<K>[]
  getMetrics(): Metrics<string>[]
  clearMetric(name: string): void
  getMetricNames(): string[]
}

export function getMetricRegistry(delay?: number): MetricRegistry
export function clearMetricRegistry(): void
