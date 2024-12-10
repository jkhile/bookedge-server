/* eslint-disable no-console */
import type { HookContext } from '../declarations'
import { google } from 'googleapis'

const fileStorageFolderName = 'fep_bookedge'

export const fileStorageHook = async (context: HookContext) => {
  try {
    const { app, result } = context
    const userService = app.service('users')
    const user = result.user

    // Check if user already has a file storage folder
    if (user.file_storage_id && result.access_token) {
      await validateFileStorage(user.file_storage_id, result)
    } else {
      if (user.googleId && result.access_token) {
        // Initialize OAuth2 client with user's access token
        const auth = new google.auth.OAuth2()
        auth.setCredentials({ access_token: result.access_token })

        // Initialize drive client with authenticated auth object
        const drive = google.drive({ version: 'v3', auth })

        const listResults = await drive.files.list({
          q: "mimeType='application/vnd.google-apps.folder' and name='fep_bookedge' and trashed=false",
        })

        if (!listResults.data.files || listResults.data.files.length === 0) {
          const newFolder = await drive.files.create({
            requestBody: {
              name: fileStorageFolderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: ['root'],
            },
          })
          // newFolder.data.id has the id of the newly created folder
          await userService.patch(user.id, {
            file_storage_id: newFolder.data.id as string,
          })
        }
      }
    }
  } catch (error: any) {
    console.error('error in hook:', error)
  }
}

async function validateFileStorage(
  fileStorageId: string,
  access_token: string,
): Promise<void> {
  // Initialize OAuth2 client with user's access token
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token })
  // Initialize drive client with authenticated auth object
  const drive = google.drive({ version: 'v3', auth })
  const response = await drive.files.get({
    fileId: fileStorageId,
    fields: 'id, name, mimeType',
  })

  const folder = response.data
  if (
    !folder ||
    folder.mimeType !== 'application/vnd.google-apps.folder' ||
    folder.name !== fileStorageFolderName
  ) {
    throw new Error('Invalid file storage folder')
  }
}
