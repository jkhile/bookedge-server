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
        // @ts-ignore
        connectionString: config_.connection,
        ssl: { rejectUnauthorized: false },
      },
    }
  }
  console.log('config:', config)
  try {
    const db = knex(config!)
    app.set('postgresqlClient', db)
  } catch (error: any) {
    console.log('error creating db:', error)
  }
  console.log('db created successsfully!')
}
