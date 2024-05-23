import Transport from 'winston-transport'
import { Log, CoralogixLogger, LoggerConfig } from 'coralogix-logger'

const coralogixKey = process.env.CORALOGIX_KEY

export class CoralogixTransport extends Transport {
  coralogixLogger: CoralogixLogger

  constructor(options: any) {
    super(options)

    const config = new LoggerConfig({
      applicationName: 'BookEdge',
      privateKey: coralogixKey,
      subsystemName: 'server',
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
