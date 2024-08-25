module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    extension: 'ts',
    stub: 'migration.stub',
  },
}
