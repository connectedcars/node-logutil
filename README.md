# node-logutil

[![Build Status](https://travis-ci.org/connectedcars/node-logutil.svg?branch=master)](https://travis-ci.org/connectedcars/node-logutil)
[![Coverage Status](https://coveralls.io/repos/github/connectedcars/node-logutil/badge.svg?branch=master)](https://coveralls.io/github/connectedcars/node-logutil?branch=master)

Simple log formatting for Node 6.x and 8.x

## Installation

``` javascript
npm install https://github.com/connectedcars/node-logutil#v1.0.1
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

## Usage

``` javascript
const log = require('logutil')

log.debug('This is a debug message')
// Outputs to stdout: {"message":"This is a debug message"}
log.info('This is an info message')
// Outputs to stdout: {"message":"This is an info message"}
log.warn('This is a warning message', { type: 'missing-item' })
// Outputs to stderr: {"message":"This is a warning message","context":{"type":"missing-item"}}
log.error('This is an error message', { context: { items: ['foo', 'bar'] } })
// Outputs to stderr: {"message":"This is an error message","context":{"items":["foo","bar"]}}

log.debug(() => {
  // Only runs if log level is debug
  return Promise.resolve('This is a debug message')
})
// Outputs to stdout: {"message":"This is a debug message"}
log.info(() => {
  // Only runs if log level is info
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('This is an info message')
    }, 500)
  })
})
// Outputs to stdout (after 500 ms): {"message":"This is an info message"}
```

## Configuration

Determining what to output depends on the environment variable `LOG_LEVEL`. This variable can be `DEBUG`, `INFO`, `WARN`, or `ERROR`, but defaults to `WARN`.
