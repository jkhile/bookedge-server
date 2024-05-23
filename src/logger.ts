// src/logger.ts
import { format } from 'date-fns'
import { pathExistsSync, readdirSync, removeSync, renameSync } from 'fs-extra'
import winston from 'winston'
import { resolve } from 'node:path'
import { CoralogixTransport } from './utils/coralogix-transport'

// on initialization, create a new log file and cleanup any
// old log files
const env = process.env.NODE_ENV || 'development'
const logFile = `./debug-${env}.log`
if (env === 'test') {
  removeSync(logFile)
} else {
  rotateLogFiles()
}

const winstonConfig = {
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: logFile }),
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

function rotateLogFiles() {
  if (pathExistsSync(logFile)) {
    const renameTo = logFile.replace(
      '.log',
      `_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.log`,
    )
    renameSync(logFile, renameTo)
  }
  const allFiles = readdirSync('./')
  const filePattern = new RegExp(`^debug-${env}.*\\.log$`)
  const logFiles = allFiles.filter((file) => filePattern.test(file)).sort()
  const allButLastThree = logFiles.slice(0, -3)

  for (const file of allButLastThree) {
    const filePath = resolve(file)
    removeSync(filePath)
  }
}
