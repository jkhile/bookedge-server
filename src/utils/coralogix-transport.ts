import Transport from 'winston-transport'
import { Log, CoralogixLogger, LoggerConfig } from 'coralogix-logger'
import { Severity as CoralogixSeverity } from 'coralogix-logger'

const coralogixKey = process.env.CORALOGIX_KEY

export class CoralogixTransport extends Transport {
  coralogixLogger: CoralogixLogger

  constructor(options: any) {
    super(options)

    // Use ENVIRONMENT variable to determine subsystem
    // Should be set to: development, staging, or production
    const subsystemName = process.env.ENVIRONMENT || 'development'
    const config = new LoggerConfig({
      applicationName: 'bookedge-server',
      privateKey: coralogixKey,
      subsystemName,
    })
    CoralogixLogger.configure(config)
    this.coralogixLogger = new CoralogixLogger('a-category')
  }

  log(info: any, callback: () => void) {
    // info will have message, level and timestamp properties
    setImmediate(() => {
      this.emit('logged', info)
    })
    const log = new Log({
      severity: getSeverity(info.level),
      text: JSON.stringify(info),
    })
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
