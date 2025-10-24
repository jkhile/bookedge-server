import { Readable, PassThrough } from 'stream'
import { logger } from '../logger'

/**
 * Convert various stream types to a Node.js Readable stream
 */
export function toReadableStream(input: any): Readable {
  if (input instanceof Readable) {
    return input
  }

  if (Buffer.isBuffer(input)) {
    return Readable.from(input)
  }

  if (typeof input === 'string') {
    return Readable.from(Buffer.from(input))
  }

  // If it's a web ReadableStream (from fetch API)
  if (input && typeof input.getReader === 'function') {
    return Readable.from(streamToAsyncIterable(input))
  }

  throw new Error('Unsupported stream type')
}

/**
 * Convert a web ReadableStream to an async iterable
 */
async function* streamToAsyncIterable(
  stream: any,
): AsyncGenerator<Uint8Array, void, unknown> {
  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Create a progress tracking stream
 */
export function createProgressStream(
  totalSize: number,
  onProgress?: (progress: { bytes: number; percent: number }) => void,
): PassThrough {
  let bytesTransferred = 0

  const progressStream = new PassThrough()

  progressStream.on('data', (chunk) => {
    bytesTransferred += chunk.length
    const percent = Math.round((bytesTransferred / totalSize) * 100)

    if (onProgress) {
      onProgress({ bytes: bytesTransferred, percent })
    }
  })

  return progressStream
}

/**
 * Handle stream errors gracefully
 */
export function handleStreamError(
  stream: Readable,
  errorHandler: (error: Error) => void,
): void {
  stream.on('error', (error) => {
    logger.error('Stream error occurred', error)
    errorHandler(error)
  })
}

/**
 * Create a throttled stream for bandwidth control
 */
export function createThrottledStream(bytesPerSecond: number): PassThrough {
  const throttleStream = new PassThrough()
  let lastTime = Date.now()
  let bytesSinceLastTime = 0

  throttleStream._transform = async function (chunk, encoding, callback) {
    bytesSinceLastTime += chunk.length

    const currentTime = Date.now()
    const timeDiff = currentTime - lastTime

    if (timeDiff < 1000) {
      // If we've sent too much data this second, delay
      if (bytesSinceLastTime > bytesPerSecond) {
        const delay = 1000 - timeDiff
        await new Promise((resolve) => setTimeout(resolve, delay))
        bytesSinceLastTime = chunk.length
        lastTime = Date.now()
      }
    } else {
      // Reset counters for new second
      bytesSinceLastTime = chunk.length
      lastTime = currentTime
    }

    callback(null, chunk)
  }

  return throttleStream
}

/**
 * Pipe stream with automatic cleanup
 */
export function pipeWithCleanup(
  source: Readable,
  destination: NodeJS.WritableStream,
  onComplete?: () => void,
  onError?: (error: Error) => void,
): void {
  source
    .pipe(destination)
    .on('finish', () => {
      if (onComplete) onComplete()
    })
    .on('error', (error) => {
      logger.error('Stream transfer error', error)
      source.destroy()
      if (onError) onError(error)
    })

  source.on('error', (error) => {
    logger.error('Source stream error', error)
    if ('destroy' in destination && typeof destination.destroy === 'function') {
      destination.destroy()
    }
    if (onError) onError(error)
  })
}
