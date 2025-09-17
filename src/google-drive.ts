// Google Drive service initialization
import type { Application } from './declarations'
import { logger } from './logger'
import { GoogleDriveManager } from './utils/google-drive-manager'

// Configure function to initialize the Drive service
export const googleDrive = async (app: Application) => {
  try {
    logger.info('Initializing Google Drive service...')

    // Get the singleton manager instance
    const driveManager = GoogleDriveManager.getInstance(app)

    // Initialize the service account client
    await driveManager.getServiceAccountClient()

    logger.info('Google Drive service initialized successfully')

    // Add the manager to the app object for direct access
    app.set('driveManager', driveManager)
  } catch (error) {
    logger.error('Failed to initialize Google Drive service', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    // We don't throw here to prevent app startup failure
    // Services that depend on Drive will need to handle this gracefully
  }
}

// Helper function to get the Drive manager from the app
export const getDriveManager = (app: Application): GoogleDriveManager => {
  const manager = app.get('driveManager')
  if (!manager) {
    throw new Error(
      'Google Drive service is not initialized. Make sure app.configure(googleDrive) has been called.',
    )
  }
  return manager
}
