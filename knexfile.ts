module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
  },
  migrations: {
    extension: 'ts',
    stub: 'migration.stub',
  },
}
