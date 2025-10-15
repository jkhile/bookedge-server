import sharp from 'sharp'
import { logger } from '../logger'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export interface ThumbnailResult {
  data: string // Base64 encoded thumbnail
  width: number
  height: number
}

/**
 * Generate a thumbnail from an image or PDF buffer
 * @param buffer - The file buffer
 * @param mimeType - The MIME type of the file
 * @param maxSize - Maximum width/height of the thumbnail (default 200)
 * @returns Base64 encoded thumbnail and dimensions
 */
export async function generateThumbnail(
  buffer: Buffer,
  mimeType: string,
  maxSize = 200,
): Promise<ThumbnailResult> {
  try {
    let imageBuffer: Buffer

    if (mimeType === 'application/pdf') {
      // Handle PDF files - extract first page as image
      logger.debug('Generating thumbnail from PDF')

      // Create temporary files for pdf-poppler
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-thumb-'))
      const tempPdfPath = path.join(tempDir, 'input.pdf')

      try {
        // Write PDF buffer to temporary file
        await fs.writeFile(tempPdfPath, buffer)

        // Convert first page of PDF to PNG using pdftocairo directly
        // This uses the system's pdftocairo (from Homebrew) for better quality
        const outputPath = path.join(tempDir, 'output')

        // Use pdftocairo to convert PDF to PNG at high resolution
        // -png: output format
        // -f 1 -l 1: only convert first page
        // -scale-to 1024: scale page to fit within 1024x1024 pixels
        // -singlefile: don't add page numbers to filename
        await execFileAsync('pdftocairo', [
          '-png',
          '-f',
          '1',
          '-l',
          '1',
          '-scale-to',
          '1024',
          '-singlefile',
          tempPdfPath,
          outputPath,
        ])

        // Read the generated PNG file (without page number suffix due to -singlefile)
        const generatedPngPath = `${outputPath}.png`
        imageBuffer = await fs.readFile(generatedPngPath)

        logger.debug('PDF converted to PNG successfully')
      } catch (pdfError) {
        logger.error('Failed to convert PDF to image, using placeholder', {
          error: pdfError,
        })

        // Fallback to placeholder if PDF conversion fails
        const svg = `
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#f5f5f5"/>
            <rect x="20" y="20" width="160" height="160" fill="white" stroke="#ddd" stroke-width="2"/>
            <text x="100" y="90" font-family="Arial" font-size="24" fill="#666" text-anchor="middle">PDF</text>
            <text x="100" y="120" font-family="Arial" font-size="14" fill="#999" text-anchor="middle">Preview</text>
          </svg>
        `
        imageBuffer = await sharp(Buffer.from(svg)).png().toBuffer()
      } finally {
        // Clean up temporary files
        try {
          await fs.rm(tempDir, { recursive: true, force: true })
        } catch (cleanupError) {
          logger.warn('Failed to clean up temporary PDF files', {
            error: cleanupError,
          })
        }
      }
    } else {
      // Handle regular image files
      imageBuffer = buffer
    }

    // Generate the thumbnail
    const thumbnail = await sharp(imageBuffer)
      .resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer()

    // Get the thumbnail metadata
    const metadata = await sharp(thumbnail).metadata()

    // Convert to base64
    const base64 = thumbnail.toString('base64')

    logger.debug('Thumbnail generated successfully', {
      originalType: mimeType,
      thumbnailSize: thumbnail.length,
      width: metadata.width,
      height: metadata.height,
    })

    return {
      data: base64,
      width: metadata.width || maxSize,
      height: metadata.height || maxSize,
    }
  } catch (error) {
    logger.error('Failed to generate thumbnail', { mimeType, error })

    // Return a placeholder thumbnail on error
    const placeholderSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f5f5f5"/>
        <rect x="40" y="40" width="120" height="120" fill="white" stroke="#ddd" stroke-width="2"/>
        <text x="100" y="100" font-family="Arial" font-size="16" fill="#999" text-anchor="middle">No Preview</text>
      </svg>
    `

    const placeholder = await sharp(Buffer.from(placeholderSvg))
      .jpeg({ quality: 80 })
      .toBuffer()

    return {
      data: placeholder.toString('base64'),
      width: 200,
      height: 200,
    }
  }
}

/**
 * Check if a MIME type is supported for thumbnail generation
 */
export function isSupportedFileType(mimeType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'application/pdf',
  ]
  return supportedTypes.includes(mimeType.toLowerCase())
}
