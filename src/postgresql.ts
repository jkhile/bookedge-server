// For more information about this file see https://dove.feathersjs.com/guides/cli/databases.html
import knex from 'knex'
import type { Knex } from 'knex'
import type { Application } from './declarations'

declare module './declarations' {
  interface Configuration {
    postgresqlClient: Knex
  }
}

export const postgresql = (app: Application) => {
  const config_ = app.get('postgresql')
  let config = config_
  if (process.env.NODE_ENV === 'production' && config_) {
    config = {
      client: 'pg',
      connection: {
        // @ts-expect-error connectionString works but isn't in the interface
        connectionString: config_.connection,
        ssl: { rejectUnauthorized: false },
      },
    }
  }
  try {
    const db = knex(config!)
    app.set('postgresqlClient', db)
  } catch (error: any) {
    console.error('error creating db:', error)
  }
}
