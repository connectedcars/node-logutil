const { getLogLevelName } = require('./levels')

const MAX_NESTED_DEPTH = 10
const MAX_TEXT_LENGTH = 100 * 1024

const reachedMaxDepth = (obj, level = 0) => {
  for (const key in obj) {
    if (typeof obj[key] == 'object') {
      level++
      return level > MAX_NESTED_DEPTH || reachedMaxDepth(obj[key], level)
    }
  }
  return false
}

const depthLimited = contents => {
  return stripStringify({
    message: 'Depth limited ' + contents
  })
}

const lengthLimited = contents => {
  let truncated = contents.substring(0, MAX_TEXT_LENGTH)
  return stripStringify({ message: 'Truncated ' + truncated })
}

const stripStringify = (mixedContent, walkerFunction) => {
  // this stops logs with multiline content being split into seperate entries on gcloud
  return JSON.stringify(mixedContent, walkerFunction).replace(/\\n/g, '\\n')
}

const formatError = (err) => {
  const errObj = {}

  for (const errKey of Object.getOwnPropertyNames(err)) {
    errObj[errKey] = err[errKey]
  }

  errObj['__constructorName'] = err.constructor.name

  return errObj
}

const formatContext = (context) => {
  const newContext = {}
  for (const key of Object.keys(context)) {
    const val = context[key]

    if (val instanceof Error) { // Errors cannot be stringified.
      newContext[key] = formatError(val)
    } else {
      newContext[key] = val
    }
  }

  return newContext
}

const format = (level, ...args) => {
  let output = {
    message: '',
    context: {},
    data: []
  }
  /*
  wrap it all in a try and catch, so if there was an
  error we go through just the object that caused an
  error, and not over zealously check every objects values
  */

  try {
    // Check for arguments
    if (args.length > 0) {
      if (args[0] instanceof Array) {
        // Stringify lists as the message and add as data
        output.message = args[0].join(', ')
        output.data = args[0]
      } else if (args[0] instanceof Object) {
        // Override logging output for objects (and errors)
        for (const key of Object.getOwnPropertyNames(args[0])) {
          output[key] = args[0][key]
        }
      } else {
        // Set primitive types as the message
        output.message = args[0]
      }
      if (args.length > 1) {
        if (args[1] instanceof Object) {
          // Set objects as secondary arguments as the context
          output.context = formatContext(args[1])
        } else {
          // Set all other types as data
          output.data.push(args[1])
        }
      }
      if (args.length > 2) {
        for (let i = 2; i < args.length; i++) {
          // Set additional arguments as data
          output.data.push(args[i])
        }
      }
    }
    if (output.message === '') {
      // Remove empty messages
      delete output.message
    }
    if (Object.keys(output.context).length === 0) {
      // Remove empty contexts
      delete output.context
    }
    if (output.data.length === 0) {
      // Remove empty data
      delete output.data
    }
    // Add level
    output.level = getLogLevelName(level)
    // Add timestamp
    output.timestamp = new Date().toISOString()
    // Stringify output
    const blob = stripStringify(output)
    // Check for size being less than than 100 KB
    if (blob.length <= MAX_TEXT_LENGTH) {
      // Check for depth above 10
      if (reachedMaxDepth(output)) {
        // Wrap deep objects in a string
        return depthLimited(blob)
      }
      // not over nesting limit or length limit
      return blob
    }
    // Truncate stringified output to 100 KB &
    // Wrap truncated output in a string
    return lengthLimited(blob)
  } catch (err) {
    if (err.message === 'Converting circular structure to JSON') {
      /*
      it is a circular reference and parse
      through the object while keeping track
      of elements occuring twice
      */

      // keep track of object values, so we know if they occur twice (circular reference)
      let seenValues = []

      var valueChecker = function (objKey, objValue) {
        if (objValue !== null && typeof objValue === 'object') {
          if (seenValues.indexOf(objValue) > -1) {
            // let it be logged that there was something sanitized
            return '[Circular:StrippedOut]'
          } else {
            // track that we have 'seen' it
            seenValues.push(objValue)
          }
        }
        // first time seeing it, return and proceed to next value
        return objValue
      }

      let returnBlob = stripStringify(output, valueChecker)

      // still we want to curtail too long logs
      if (returnBlob.length >= MAX_TEXT_LENGTH) {
        // Wrap truncated output in a string
        return lengthLimited(returnBlob)
      }

      // but what if it is still too long?
      /*
      don't check depth on the original object
      which contains circular references. Parse
      the santisized down object back to an
      object to count object depth
      */
      if (reachedMaxDepth(JSON.parse(returnBlob))) {
        return depthLimited(returnBlob)
      }

      // the object wasn't too long or too nested, return the stringified object
      return returnBlob
    } else {
      // it isn't an error we know how to handle
      throw err
    }
  }
}

module.exports = {
  format,
  reachedMaxDepth
}
