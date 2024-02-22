import { format } from 'date-fns'
import { pathExistsSync, readdirSync, removeSync, renameSync } from 'fs-extra'
import winston from 'winston'
// src/logger.ts
import { resolve } from 'node:path'

// on initialization, create a new log file and cleanup any
// old log files
const env = process.env.NODE_ENV || 'development'
const logFile = `./debug-${env}.log`
if (env === 'test') {
  removeSync(logFile)
} else {
  rotateLogFiles()
}

export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: logFile }),
  ],
})

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
