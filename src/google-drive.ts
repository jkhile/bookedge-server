// Google Drive service initialization
import { Application } from './declarations'
import { logger } from './logger'
import {
  createGoogleDriveService,
  GoogleDriveService,
} from './utils/google-drive-service'

// This will store the singleton instance
let googleDriveService: GoogleDriveService | null = null

// Function to get the Drive service instance
export const getDriveService = (): GoogleDriveService => {
  if (!googleDriveService) {
    throw new Error(
      'Google Drive service is not initialized. Make sure app.configure(googleDrive) has been called.',
    )
  }
  return googleDriveService
}

// Configure function to initialize the Drive service
export const googleDrive = async (app: Application) => {
  try {
    logger.info('Initializing Google Drive service...')
    googleDriveService = await createGoogleDriveService(app)
    logger.info('Google Drive service initialized successfully')

    // Add the service to the app object for direct access
    app.set('driveService', googleDriveService)
  } catch (error) {
    logger.error('Failed to initialize Google Drive service', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    // We don't throw here to prevent app startup failure
    // Services that depend on Drive will need to handle this gracefully
  }
}
