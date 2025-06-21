// src/logger.ts
import { removeSync } from 'fs-extra'
import winston from 'winston'
import { CoralogixTransport } from './utils/coralogix-transport'

// on initialization, create a new log file (only in dev mode)
const env = process.env.NODE_ENV || 'development'
const logFile = `./debug-${env}.log`
if (env === 'test') {
  removeSync(logFile)
} else if (env === 'development') {
  // Clear the existing log file for a fresh start
  removeSync(logFile)
}

const winstonConfig = {
  level: 'debug',
  format: winston.format.combine(
    // Custom format to handle client timestamps
    winston.format((info) => {
      // If there's already a timestamp in the log data (from client), keep it
      if (!info.timestamp || typeof info.timestamp !== 'string') {
        // Server log - add server timestamp
        info.timestamp = new Date().toISOString()
      }
      // Client logs already have timestamp from the logData
      return info
    })(),
    winston.format.json(),
  ),
  transports:
    env === 'development' || env === 'test'
      ? [
          new winston.transports.File({ filename: logFile }),
          // new winston.transports.Console(),
        ]
      : [
          // new winston.transports.Console(),
        ],
}

if (process.env.CORALOGIX_LOGGER === 'true') {
  winstonConfig.transports.push(
    new CoralogixTransport(
      {},
    ) as unknown as winston.transports.FileTransportInstance,
  )
}

export const logger = winston.createLogger(winstonConfig)
