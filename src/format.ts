import { getLogLevelName } from './levels'

const MAX_NESTED_DEPTH = 10
const MAX_TEXT_LENGTH = 70 * 1024

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reachedMaxDepth(obj: any, level = 0): boolean {
  for (const key in obj) {
    if (typeof obj[key] == 'object') {
      level++
      return level > MAX_NESTED_DEPTH || reachedMaxDepth(obj[key], level)
    }
  }
  return false
}

function depthLimited(contents: string): string {
  return stripStringify({ message: 'Depth limited ' + contents })
}

function lengthLimited(contents: string): string {
  const truncated = contents.substring(0, MAX_TEXT_LENGTH)
  return stripStringify({ message: 'Truncated ' + truncated })
}

function stripStringify(
  mixedContent: Parameters<typeof JSON.stringify>[0],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walkerFunction?: (objKey: any, objValue: string) => any
): string {
  // this stops logs with multiline content being split into seperate entries on gcloud
  return JSON.stringify(mixedContent, walkerFunction).replace(/\\n/g, '\\n')
}

function formatError(err: Error): Record<string, unknown> {
  const errObj: Record<string, unknown> = {}

  for (const errKey of Object.getOwnPropertyNames(err)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    errObj[errKey] = err[errKey]
  }

  errObj['__constructorName'] = err.constructor.name

  return errObj
}

function formatContext(context: Record<string, unknown>): Record<string, unknown> {
  const newContext: Record<string, unknown> = {}
  for (const key of Object.keys(context)) {
    const val = context[key]

    if (val instanceof Error) {
      // Errors cannot be stringified.
      newContext[key] = formatError(val)
    } else {
      newContext[key] = val
    }
  }

  return newContext
}

export function format(level: number, ...args: unknown[]): string {
  const output: Record<string, unknown> & { message?: string; context?: Record<string, unknown>; data?: unknown[] } = {
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
          output[key] = (args[0] as Record<string, unknown>)[key]
        }
      } else {
        // Set primitive types as the message
        output.message = `${args[0]}`
      }
      if (args.length > 1) {
        if (args[1] instanceof Object) {
          // Set objects as secondary arguments as the context
          output.context = formatContext(args[1] as Record<string, unknown>)
          // Try to find trace info from context
          // Based on field in LogEntry: https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#FIELDS.trace_sampled
          if (output.context['spanId'] && output.context['trace'] && output.context['traceSampled']) {
            output.trace = output.context['trace']
            output.spanId = output.context['spanId']
            output.traceSampled = output.context['traceSampled']
            // We don't need these fields in the context
            delete output.context['spanId']
            delete output.context['trace']
            delete output.context['traceSampled']
          }
        } else {
          // Set all other types as data
          output.data?.push(args[1])
        }
      }
      if (args.length > 2) {
        for (let i = 2; i < args.length; i++) {
          // Set additional arguments as data
          output.data?.push(args[i])
        }
      }
    }
    if (output.message === '') {
      // Remove empty messages
      delete output.message
    }
    if (output.context && Object.keys(output.context).length === 0) {
      // Remove empty contexts
      delete output.context
    }
    if (output.data?.length === 0) {
      // Remove empty data
      delete output.data
    }
    // Add level (Stackdriver support)
    output.severity = getLogLevelName(level)
    // Add timestamp
    output.timestamp = new Date().toISOString()
    // Ensure that message size is no more than half the total allowed size for the blob
    // This is to truncate very large sql statements
    if (output.message && output.message.length > MAX_TEXT_LENGTH / 2) {
      output.message = `Truncated: ${output.message.substring(0, MAX_TEXT_LENGTH / 2)}...`
    }
    // Stringify output
    const blob = stripStringify(output)
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
    if (err.message.indexOf('Converting circular structure to JSON') !== -1) {
      /*
      it is a circular reference and parse
      through the object while keeping track
      of elements occuring twice
      */

      // keep track of object values, so we know if they occur twice (circular reference)
      const seenValues: string[] = []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const valueChecker = function (objKey: any, objValue: string): any {
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

      const returnBlob = stripStringify(output, valueChecker)

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
