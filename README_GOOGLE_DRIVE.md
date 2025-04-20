# BookEdge Google Drive Integration

This document provides information on how to use the Google Drive integration in the BookEdge server.

## Overview

The Google Drive service allows the BookEdge server to:

- Store files in a shared BookEdge folder in Google Drive
- Organize book-related files in a consistent folder structure
- Upload, download, and manage files associated with books
- Retrieve file metadata and thumbnails

This integration uses a service account to access Google Drive without requiring individual user authentication, making it suitable for server-side automation and background tasks.

## Setup

### 1. Google Cloud Configuration

1. Create or use an existing Google Cloud project
2. Enable the Google Drive API
3. Create a service account with Drive API access
4. Generate and download the service account key JSON file
5. Share the appropriate Google Drive folders with the service account

### 2. Environment Configuration

Set the following environment variables:

```
GOOGLE_DRIVE_SERVICE_ACCOUNT=/path/to/service-account-key.json
# or provide the JSON content directly:
GOOGLE_DRIVE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

GOOGLE_DRIVE_ROOT_FOLDER=BookEdge
GOOGLE_WORKSPACE_DOMAIN=frontedgepublishing.com
```

Alternatively, update the configurations in `config/default.json` or `config/production.json`.

## Architecture

The Google Drive service is initialized when the server starts up and is available throughout the application:

1. At server startup, `app.configure(googleDrive)` is called in `app.ts`
2. This initializes the drive service and makes it globally available
3. You can access the service using the `getDrive()` helper function in any part of the application

## Usage

### Accessing the Drive Service

```typescript
import { getDrive } from '../utils/drive-helper'

// In a hook or service
const driveService = getDrive(app)
```

### Common Operations

#### Creating Folders

```typescript
// Create a folder in the root BookEdge folder
const folder = await driveService.createFolder('FolderName', driveService.getRootFolderId())

// Create a nested folder
const subFolder = await driveService.createFolder('SubFolder', folder.id)
```

#### Uploading Files

```typescript
// Upload from a local file path
const file = await driveService.uploadFile('/path/to/file.pdf', {
  folderId: 'folder-id',
  name: 'document.pdf',
  description: 'Description of the file'
})

// Upload content directly from memory
const content = 'File content as string'
const file = await driveService.uploadContent(content, {
  folderId: 'folder-id',
  name: 'document.txt'
})
```

#### Downloading Files

```typescript
// Download to a local path
await driveService.downloadFile('file-id', '/path/to/save/file.pdf')

// Get content as string
const content = await driveService.getFileContent('file-id')

// Get content as buffer
const buffer = await driveService.getFileBuffer('file-id')
```

#### Finding Files

```typescript
// List files in a folder
const files = await driveService.listFiles('folder-id')

// Search for files
const files = await driveService.findFiles({
  q: "name contains 'report' and mimeType='application/pdf'",
  fields: 'files(id, name, mimeType, webViewLink)'
})
```

#### Managing Files

```typescript
// Get file metadata
const file = await driveService.getFile('file-id')

// Update file metadata
await driveService.updateFile('file-id', {
  name: 'New name',
  description: 'Updated description'
})

// Move a file to a different folder
await driveService.moveFile('file-id', 'target-folder-id')

// Delete a file
await driveService.deleteFile('file-id')
```

## Integration with BookEdge Entities

### Books

Each book can have its own folder in Google Drive. The `books` table has a `file_storage_id` field that stores the folder ID for the book.

```typescript
// Creating a folder for a new book
const booksFolder = await driveService.createFolder('Books', driveService.getRootFolderId())
const bookFolder = await driveService.createFolder(`Book_${bookId}`, booksFolder.id)

// Update the book with the folder ID
await app.service('books').patch(bookId, { file_storage_id: bookFolder.id })
```

### Example Hook

See `src/hooks/drive-file-hook.ts` for examples of hooks that create folders for books and handle file uploads.

## Working with Files in the UI

1. When a user uploads a file through the UI, the file is:
   - Temporarily stored on the server
   - Uploaded to Google Drive
   - Removed from the server
   - The Drive file ID is stored in the database

2. When a user requests a file:
   - The server fetches the file from Google Drive
   - Serves it to the client

This approach minimizes storage requirements on the server while maintaining file organization and accessibility.

## Security Considerations

- The service account has its own permissions in Google Drive
- Files can be shared with specific users or domains through the API
- All file operations are logged for audit purposes
- The service account credentials should be kept secure and never exposed to clients

## For More Information

- See detailed documentation in `src/utils/GOOGLE_DRIVE_SERVICE.md`
- Check example usage in `src/utils/drive-helper.ts`
- Refer to the Google Drive API documentation: https://developers.google.com/drive/api/guides/about-sdk