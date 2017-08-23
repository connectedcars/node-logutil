# node-logutil

[![Build Status](https://travis-ci.org/connectedcars/node-logutil.svg?branch=master)](https://travis-ci.org/connectedcars/node-logutil)

Simple log formatting for Node 6.x and 8.x

## Installation

``` javascript
npm install logutil
```

## Usage

``` javascript
const log = require('logutil')

log.debug('This is a debug message')
log.info('This is an info message')
log.warn('This is a warning message', { type: 'missing-item' })
log.error('This is an error message', { context: { items: ['foo', 'bar'] } })

log.debug(() => {
  return Promise.resolve('This is a debug message')
})
log.info(() => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('This is an info message')
    }, 500)
  })
})
```

## Configuration

Determining what to output depends on the environment variable `LOG_LEVEL`. This variable can be `DEBUG`, `INFO`, `WARN`, or `ERROR`, but defaults to `WARN`.
