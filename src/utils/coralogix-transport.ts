import Transport from 'winston-transport'
import { Log, CoralogixLogger, LoggerConfig } from 'coralogix-logger'
import { Severity as CoralogixSeverity } from 'coralogix-logger'

const coralogixKey = process.env.CORALOGIX_KEY

export class CoralogixTransport extends Transport {
  coralogixLogger: CoralogixLogger

  constructor(options: any) {
    super(options)

    const appHost = process.env.HOST
    console.log('appHost:', appHost)
    let subsystemName = 'development'
    if (appHost?.includes('staging')) {
      subsystemName = 'staging'
    } else if (appHost?.includes('production')) {
      subsystemName = 'production'
    }
    console.log('subsystemName:', subsystemName)
    const config = new LoggerConfig({
      applicationName: 'bookedge-server',
      privateKey: coralogixKey,
      subsystemName,
    })
    CoralogixLogger.configure(config)
    this.coralogixLogger = new CoralogixLogger('a-category')
  }

  log(info: any, callback: () => void) {
    console.log('info:', info)
    // info will have message, level and timestamp properties
    setImmediate(() => {
      this.emit('logged', info)
    })
    const log = new Log({
      severity: getSeverity(info.level),
      text: JSON.stringify(info),
    })
    console.log('log:', log)
    this.coralogixLogger.addLog(log)

    callback()
  }
}

// Convert severity string to Coralogix Severity enum
function getSeverity(severity: string): CoralogixSeverity {
  switch (severity.toLowerCase()) {
    case 'debug': {
      return CoralogixSeverity.debug
    }
    case 'verbose': {
      return CoralogixSeverity.verbose
    }
    case 'info': {
      return CoralogixSeverity.info
    }
    case 'warn': {
      return CoralogixSeverity.warning
    }
    case 'error': {
      return CoralogixSeverity.error
    }
    case 'critical': {
      return CoralogixSeverity.critical
    }
    default: {
      return CoralogixSeverity.info
    }
  }
}
