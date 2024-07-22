import Transport from 'winston-transport'
import { Log, CoralogixLogger, LoggerConfig } from 'coralogix-logger'

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
    // info will have message, level and timestamp properties
    setImmediate(() => {
      this.emit('logged', info)
    })
    const log = new Log({
      // severity: Severity.info,
      // text: info.message,
      text: JSON.stringify(info),
    })
    this.coralogixLogger.addLog(log)

    callback()
  }
}
