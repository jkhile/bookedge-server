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
  const config = app.get('postgresql')
  if (process.env.NODE_ENV === 'production' && config) {
    config.connection = `${config?.connection}?sslmode=require`
  }
  console.log('config:', config)
  const db = knex(config!)

  app.set('postgresqlClient', db)
}
