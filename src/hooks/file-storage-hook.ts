import type { HookContext } from '../declarations'
import type { User } from '../services/users/users'
import { google } from 'googleapis'
import { GeneralError } from '@feathersjs/errors'
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
  userId: number,
  userService: any,
): Promise<boolean> {
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
      logger.error('Invalid file storage folder detected', {
        userId,
        fileId,
        folderName: folder?.name,
        mimeType: folder?.mimeType,
      })

      // Clear the invalid storage ID
      await userService.patch(userId, {
        file_storage_id: null,
      })

      return false
    }

    return true
  } catch (error) {
    logger.error('Storage validation failed', {
      userId,
      fileId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    // Clear the invalid storage ID
    await userService.patch(userId, {
      file_storage_id: '',
    })

    return false
  }
}

export const fileStorageHook = async (context: HookContext) => {
  const { app, result } = context
  const authResult = result as AuthResult

  // if the user hasn't signed in with Google OAuth, can't access GDrive
  if (
    authResult.authentication.strategy !== 'google' ||
    !authResult.user?.googleId ||
    !authResult.user.access_token
  ) {
    return context
  }

  try {
    const userService = app.service('users')

    // Check existing storage
    if (authResult.user.file_storage_id) {
      const isValid = await validateFileStorage(
        authResult.user.file_storage_id,
        authResult.user.access_token,
        authResult.user.id,
        userService,
      )

      if (!isValid) {
        // Continue execution to create new storage
        logger.info(
          'Proceeding to create new storage after validation failure',
          {
            userId: authResult.user.id,
          },
        )
      } else {
        return context
      }
    }

    // Initialize drive client
    const drive = await createDriveClient(authResult.user?.access_token)

    // Check for existing folder
    const listResults = await drive.files.list({
      q: `mimeType='${FOLDER_MIME_TYPE}' and name='${FOLDER_NAME}' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
    })

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
