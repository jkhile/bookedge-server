import { app } from './app'
import { logger } from './logger'

const port = app.get('port')
const host = app.get('host')
const db = app.get('postgresql')

process.on('unhandledRejection', (reason, p) =>
  logger.error(`Unhandled Rejection at: Promise ${p}, ${reason}`),
)

app.listen(port).then(() => {
  const startMsg = `Feathers application started on ${host}:${port}, db: ${JSON.stringify(
    db,
    undefined,
    2,
  )}`
  logger.info(startMsg)
  console.info(startMsg)
})
