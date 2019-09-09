export function debug(...args: any[]): void
export function statistic(...args: any[]): void
export function info(...args: any[]): void
export function warn(...args: any[]): void
export function error(...args: any[]): void
export function critical(...args: any[]): void

export class MetricRegistry {
  public gauge(name: string, value: number, labels?: object): Promise<void>
  cumulative(name: string, value: number, labels?: object): Promise<void>
  logMetrics(): Promise<void>
}
