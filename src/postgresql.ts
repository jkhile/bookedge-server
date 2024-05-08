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
  console.log('process.env:', process.env)
  const config = app.get('postgresql')
  console.log('config:', config)
  const db = knex(config!)

  app.set('postgresqlClient', db)
}
