const { getLogLevelName } = require('./levels')

const depthOf = obj => {
  let level = 1
  for (const key in obj) {
    if (typeof obj[key] == 'object') {
      const depth = depthOf(obj[key]) + 1
      level = Math.max(depth, level)
    }
  }
  return level
}

module.exports = (level, ...args) => {
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
          output.context = args[1]
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
    const blob = JSON.stringify(output)
    // Check for size being less than than 100 KB
    if (blob.length <= 100 * 1024) {
      // Check for depth above 10
      if (depthOf(output) > 10) {
        // Wrap deep objects in a string
        return JSON.stringify({ message: 'Depth limited ' + blob })
      }
      return blob
    }
    // Truncate stringified output to 100 KB
    const truncated = blob.substring(0, 100 * 1024)
    // Wrap truncated output in a string
    return JSON.stringify({ message: 'Truncated ' + truncated })
  } catch (err) {
    if (err.message === 'Converting circular structure to JSON') {
      /*
      it is a circular reference and parse 
      through the object while keeping track 
      of elements occuring twice
      */

      // keep track of object values, so we know if they occur twice (circular reference)
      let seenValues = []

      var valueChecker = function(objKey, objValue) {
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

      return JSON.stringify(output, valueChecker)
    } else {
      // it isn't an error we know how to handle
      throw err
    }
  }
}
