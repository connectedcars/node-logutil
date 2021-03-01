# node-logutil



[![Build Status](https://travis-ci.org/connectedcars/node-logutil.svg?branch=master)](https://travis-ci.org/connectedcars/node-logutil)
[![Coverage Status](https://coveralls.io/repos/github/connectedcars/node-logutil/badge.svg?branch=master)](https://coveralls.io/github/connectedcars/node-logutil?branch=master)

Simple log formatting for Node 6.x and 8.x

## Installation

``` javascript
npm install https://github.com/connectedcars/node-logutil#v1.1.3
```

## API

### log.debug(message[, context])

Logs the provided `message` with the optional `context` as a JSON string, if the log level is set to output debug.

The method takes most input, but the combination described above is the recommended one.

#### message

Type: `string`

Descriptive log message

#### context

Type: `object`

Object hash to provide log context.

### log.statistic(message[, context])

Logs the provided `message` with the optional `context` as a JSON string, if the log level is set to output statistic.

The method takes most input, but the combination described above is the recommended one.

#### message

Type: `string`

Descriptive log message

#### context

Type: `object`

Object hash to provide log context.

### log.info(message[, context])

Logs the provided `message` with the optional `context` as a JSON string, if the log level is set to output info.

The method takes most input, but the combination described above is the recommended one.

#### message

Type: `string`

Descriptive log message

#### context

Type: `object`

Object hash to provide log context.

### log.warn(message[, context])

Logs the provided `message` with the optional `context` as a JSON string, if the log level is set to output warnings.

The method takes most input, but the combination described above is the recommended one.

#### message

Type: `string`

Descriptive log message

#### context

Type: `object`

Object hash to provide log context.

### log.error(message[, context])

Logs the provided `message` with the optional `context` as a JSON string, if the log level is set to output errors.

The method takes most input, but the combination described above is the recommended one.

#### message

Type: `string`

Descriptive log message

#### context

Type: `object`

Object hash to provide log context.

### log.critical(message[, context])

Logs the provided `message` with the optional `context` as a JSON string, if the log level is set to output critical.

The method takes most input, but the combination described above is the recommended one.

#### message

Type: `string`

Descriptive log message

#### context

Type: `object`

Object hash to provide log context.

## log.MetricRegistry()
A singleton instance that holds the state of all metrics in the application at a given point in time. The class should be instantiated globally and kept through the process lifetime.

### log.MetricsRegistry.prototype.cumulative(name, value[, labels])
A monotically increasing number that. E.g. the number of requests since the process started.

#### name
Type: `string`
Name of the metric to write. The recommended format is `[namespace]/[metric-name]`. E.g. `ingester/queue-size` 


#### value
Type: `number`
A value to write. It's worth noting that we're always using floating-point precision for these values.

#### labels
Type: `object`
An optional label map that denotes some specific properties you want to group by / filter on later. Please note that this map _must_ have hashable values. Thus, you're not allowed to nest objects.
It's also worth noting that the `MetricRegistry` will log all permutations of the label, so please only use it to store categorical types and not, say `carId`s.
Example: `{tableName: 'LatestCarPositions'}`


##### Scenarios where you'd want to use this metric type
Generally every time you're interested in monitoring:
* the relative change in a value (marginal difference)
* or the value relative to the time period

E.g.
* Inserted rows since last time
* Incoming HTTP requests


### log.MetricsRegistry.prototype.gauge(name, value[, labels, reducerFn])
_Please refer to `log.MetricsRegistry.prototype.cumulative()` for a definition of the arguments name, value and labels_

An instantaneous measurement of a varying number. Per default, we will only store the value and timestamp of the latest inserted value. So if you insert two values, e.g. `gauge('foo', 2)` at time 0 and `gauge('foo', 4)` at time 2, and the metrics are scraped at time 3, we will report `value=4,time=2` to the log. If you for some reason don't want this, you can specify an optional `reducerFn` argument:
```
// Function that takes the mean over all values in that timespan
const fn = (arr) => arr.reduce((a, b) => a+b)) / arr.length

// Sample some data
registry.gauge('foo', 10, null, fn)
registry.gauge('foo', 20, null, fn)

// logMetric reports value=30 and generates a timestamp
registry.logMetrics()
```

##### Scenarios where you'd want to use this metric type
Every time you want to capture a state at a particular time. E.g.:
* Size of a queue at a particular time
* CPU utilization

A rule of thumb: If a value can go vary (i.e. go up and down), and it should be captured at a specific time, then it's a good candidate for a gauge.


### log.MetricRegistry.prototype.logMetrics()
Captures a snapshot of the image state and adds `endTime=Date.now()` to all objects. Afterwards all metrics are dumped to stdout using `node-logutil`'s `log.statistic` function. All metrics are dumped using `LOG_LEVEL=INFO`, so make sure your application uses at least that log level.

This function is intended to be used together with [metrics-subscriber-api](https://github.com/connectedcars/metrics-subscriber-api)


### log.MetricRegistry.prototype.getMetrics()
Returns all metrics as an array of objects.
Example:
```
{
  name: 'gauge-metric',
  type: 'GAUGE',
  value: 50,
  labels: { brand: 'vw' }
}
```
### log.MetricRegistry.prototype.getPrometheusMetrics()
Returns an array of strings formatted using the [Prometheus exposition format](https://github.com/prometheus/docs/blob/master/content/docs/instrumenting/exposition_formats.md)
The format should follow their EBNF definition, but is not tested against a parser as of this moment.


This function is intended to be exposed through a small HTTP server and used in conjunction with Prometheus in the future.

## Usage

``` javascript
const log = require('logutil')

log.debug('This is a debug message')
// Outputs to stdout: {"message":"This is a debug message","severity":"DEBUG","timestamp":"2017-09-01T13:37:42Z"}
log.debug('This is a statistic value', { foo: 42, bar: 1337 })
// Outputs to stdout: {"message":"Statistics","severity":"STATISTIC","timestamp":"2017-09-01T13:37:42Z", "content":{"foo":42,"bar":1337}}
log.info('This is an info message')
// Outputs to stdout: {"message":"This is an info message","severity":"INFO","timestamp":"2017-09-01T13:37:42Z"}
log.warn('This is a warning message', { type: 'missing-item' })
// Outputs to stderr: {"message":"This is a warning message","severity":"WARNING","timestamp":"2017-09-01T13:37:42Z","context":{"type":"missing-item"}}
log.error('This is an error message', { context: { items: ['foo', 'bar'] } })
// Outputs to stderr: {"message":"This is an error message","severity":"ERROR","timestamp":"2017-09-01T13:37:42Z","context":{"items":["foo","bar"]}}
log.critical('This is a critical message', { context: { items: ['foo', 'bar'] } })
// Outputs to stderr: {"message":"This is a critical message","severity":"CRITICAL","timestamp":"2017-09-01T13:37:42Z","context":{"items":["foo","bar"]}}

log.debug(() => {
  // Only runs if log level is debug
  return Promise.resolve('This is a debug message')
})
// Outputs to stdout: {"message":"This is a debug message","severity":"DEBUBG","timestamp":"2017-09-01T13:37:42Z"}
log.info(() => {
  // Only runs if log level is info
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('This is an info message')
    }, 500)
  })
})
// Outputs to stdout (after 500 ms): {"message":"This is an info message","severity":"INFO","timestamp":"2017-09-01T13:37:42Z"}

// Instantiate as a singleton
const registry = log.MetricRegistry()

// Write some data
await registry.gauge('namespace/metric-name', 20, {brand: 'vw'})
await registry.cumulative('namespace/cumulative-metric-name', 40, {brand: 'seat'})

// In case you want to do aggregations more granular than the regular dump, you can pass in a reducer function taking an array of numbers.
await registry.gauge('namespace/metric-name', 20, {brand: 'vw'}, (arr) => arr.reduce((a, b) => a+b)) / arr.length

// Dump metrics to stdout regularly
setInterval(registry.logMetrics, 30000)
```

## Configuration

Determining what to output depends on the environment variable `LOG_LEVEL`. This variable can be `DEBUG`, `STATISTIC`, `INFO`, `WARN`, `ERROR`, or `CRITICAL` but defaults to `WARN`.
