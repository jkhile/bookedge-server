# Google Drive Service for BookEdge

This document describes how to use the Google Drive utility service for BookEdge server.

## Setup

### 1. Create a Google Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "Service Account"
5. Fill in the service account details:
   - Name: "BookEdge Server"
   - ID: "bookedge-server"
   - Description: "Service account for BookEdge server to access Google Drive"
6. Click "Create and Continue"
7. For "Grant this service account access to project", assign the following roles:
   - "Drive API > Drive Admin" (or a more restrictive role if preferred)
8. Click "Done"
9. From the service accounts list, click on the newly created service account
10. Go to the "Keys" tab, click "Add Key" > "Create new key"
11. Choose JSON format and click "Create"
12. Save the downloaded JSON file securely - this is your service account key file

### 2. Share the Google Drive Folder with the Service Account

1. Create a folder in Google Drive where BookEdge files will be stored
2. Share this folder with the service account email (found in the JSON key file under `client_email`)
3. Grant "Editor" access to the service account

### 3. Configure the BookEdge Server

Set the following environment variables:

```
GOOGLE_DRIVE_SERVICE_ACCOUNT=/path/to/service-account-key.json
# or provide the JSON content directly:
GOOGLE_DRIVE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

GOOGLE_DRIVE_ROOT_FOLDER=BookEdge
GOOGLE_WORKSPACE_DOMAIN=frontedgepublishing.com
```

Alternatively, update the configuration in `config/default.json` or `config/production.json`.

## Using the Service

Import the Google Drive service composable in your code:

```typescript
import { useGoogleDrive } from '../utils/google-drive-service'

// In a FeathersJS service or hook:
export default (app: Application) => {
  const bookUploadHandler = async (bookId: number, filePath: string) => {
    // Get the Google Drive service
    const { getService } = useGoogleDrive(app)
    const driveService = await getService()
    
    // Use the service...
    const booksFolder = await driveService.createFolder('Books', driveService.getRootFolderId())
    
    // Upload a file
    const file = await driveService.uploadFile(filePath, {
      folderId: booksFolder.id,
      name: `book_${bookId}.pdf`,
      description: `Book ${bookId} PDF file`
    })
    
    // Save file reference to the database
    return file
  }
  
  // ... rest of your service code
}
```

## API Reference

### Getting Started

```typescript
// Initialize the service
const { getService } = useGoogleDrive(app)
const driveService = await getService()
```

### Working with Folders

```typescript
// Get root folder ID
const rootFolderId = driveService.getRootFolderId()

// Create a folder
const folder = await driveService.createFolder('FolderName', parentFolderId)

// List files in a folder
const files = await driveService.listFiles(folderId)
```

### Working with Files

```typescript
// Upload a file
const file = await driveService.uploadFile('/path/to/local/file.pdf', {
  folderId: 'folder-id',
  name: 'document.pdf',
  description: 'Document description'
})

// Upload content directly from memory
const fileContent = Buffer.from('File content')
const file = await driveService.uploadContent(fileContent, {
  folderId: 'folder-id',
  name: 'document.txt',
  description: 'Text document'
})

// Download a file
await driveService.downloadFile('file-id', '/path/to/save/file.pdf')

// Get file metadata
const metadata = await driveService.getFile('file-id')

// Delete a file
await driveService.deleteFile('file-id')
```

### Searching and Organization

```typescript
// Find files
const files = await driveService.findFiles({
  q: "name contains 'report' and mimeType='application/pdf'",
  fields: 'files(id, name, mimeType, webViewLink)',
  pageSize: 100
})

// Move a file to a different folder
await driveService.moveFile('file-id', 'target-folder-id')

// Update file metadata
await driveService.updateFile('file-id', {
  name: 'New name',
  description: 'Updated description'
})
```

### Thumbnails and Previews

```typescript
// Get a thumbnail URL for a file
const thumbnailUrl = await driveService.getThumbnail('file-id', 'medium')
```

### Sharing and Permissions

```typescript
// Share with a user
await driveService.setPermission('file-id', {
  role: 'reader',
  type: 'user',
  emailAddress: 'user@example.com'
})

// Share with anyone (public link)
await driveService.setPermission('file-id', {
  role: 'reader',
  type: 'anyone'
})
```

## Google Drive Query Language

The `findFiles()` and similar methods support Google Drive's query language. Here are some examples:

```typescript
// Find PDF files
await driveService.findFiles({
  q: "mimeType='application/pdf'"
})

// Find files modified in the last 7 days
await driveService.findFiles({
  q: "modifiedTime > '2025-04-11T00:00:00'"  // Use actual date string
})

// Find files containing 'report' in the name
await driveService.findFiles({
  q: "name contains 'report'"
})

// Combined query
await driveService.findFiles({
  q: "mimeType='application/pdf' and name contains 'report' and not name contains 'draft'"
})
```

## Best Practices

1. **Folder Structure**: Maintain a consistent folder structure (Books, Reports, etc.)
2. **Error Handling**: Always catch and log errors when using Drive API
3. **Batch Operations**: Use Promise.all for multiple file operations
4. **Cleanup**: Always clean up temporary files after using them
5. **Database References**: Store Google Drive file IDs in your database records
6. **Permissions**: Be careful with permission settings to avoid data leakage

## See Also

Check out the example usages in `src/utils/google-drive-example.ts` for more practical code samples.