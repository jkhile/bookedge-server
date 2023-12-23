import { app } from './src/app'
// For more information about this file see https://dove.feathersjs.com/guides/cli/databases.html

// Load our database connection info from the app configuration
const config = app.get('postgresql')

module.exports = config
