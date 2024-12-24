import type { HookContext } from '../declarations'
import type { User } from '../services/users/users'
import { google } from 'googleapis'
import { Forbidden, GeneralError } from '@feathersjs/errors'
import { logger } from '../logger'

const FOLDER_NAME = 'fep_bookedge'
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'
const REQUIRED_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
]

interface AuthResult {
  user: User
  jwtToken: string
  authentication: { strategy: string }
}

async function createDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({
    access_token: accessToken,
    scope: REQUIRED_SCOPES.join(' '),
  })

  return google.drive({ version: 'v3', auth })
}

async function validateFileStorage(
  fileId: string,
  accessToken: string,
): Promise<void> {
  try {
    const drive = await createDriveClient(accessToken)

    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType',
    })

    const folder = response.data
    if (
      !folder ||
      folder.mimeType !== FOLDER_MIME_TYPE ||
      folder.name !== FOLDER_NAME
    ) {
      throw new Forbidden('Invalid file storage folder')
    }
  } catch (error) {
    logger.error('Storage validation failed:', error)
    if (error instanceof Error) {
      throw new GeneralError(`Failed to validate storage: ${error.message}`)
    }
    throw error
  }
}

export const fileStorageHook = async (context: HookContext) => {
  const { app, result } = context
  const authResult = result as AuthResult

  // if the user hasn't signed in with Google Oauth, can't access GDrive
  if (
    authResult.authentication.strategy !== 'google' ||
    !authResult.user?.googleId ||
    !authResult.user.access_token
  ) {
    return context
  }

  try {
    // Check existing storage
    if (authResult.user.file_storage_id) {
      await validateFileStorage(
        authResult.user.file_storage_id,
        authResult.user.access_token,
      )
      return context
    }

    // Initialize drive client
    const drive = await createDriveClient(authResult.user?.access_token)

    // Check for existing folder
    const listResults = await drive.files.list({
      q: `mimeType='${FOLDER_MIME_TYPE}' and name='${FOLDER_NAME}' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
    })

    const userService = app.service('users')

    if (listResults.data.files?.length) {
      // Existing folder found - use the first matching folder
      const existingFolder = listResults.data.files[0]
      await userService.patch(authResult.user.id, {
        file_storage_id: existingFolder.id as string,
      })
      return context
    }

    // No existing folder - create new one
    const newFolder = await drive.files.create({
      requestBody: {
        name: FOLDER_NAME,
        mimeType: FOLDER_MIME_TYPE,
        parents: ['root'],
      },
      fields: 'id',
    })

    if (!newFolder.data.id) {
      throw new GeneralError('Failed to create storage folder')
    }

    await userService.patch(authResult.user.id, {
      file_storage_id: newFolder.data.id,
    })

    return context
  } catch (error) {
    logger.error('File storage hook error:', {
      userId: authResult.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}
