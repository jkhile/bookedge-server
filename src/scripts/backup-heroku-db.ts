#!/usr/bin/env ts-node

import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, readdir, stat, unlink } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import { createGzip } from 'zlib'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream'

const readdirAsync = promisify(readdir)
const statAsync = promisify(stat)
const unlinkAsync = promisify(unlink)
const pipelineAsync = promisify(pipeline)

// Configuration
const HEROKU_APP_NAME = process.env.HEROKU_APP_NAME || 'bookedge'
const BACKUP_DIR = process.env.BACKUP_DIR || './backups'
const TIMESTAMP = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .split('.')[0]
const BACKUP_FILENAME = `bookedge_${TIMESTAMP}.sql`
const BACKUP_PATH = join(BACKUP_DIR, BACKUP_FILENAME)

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
}

interface BackupOptions {
  herokuAppName: string
  backupDir: string
  keepBackups: number
}

class HerokuDatabaseBackup {
  private options: BackupOptions

  constructor(options: BackupOptions) {
    this.options = options
  }

  private log(message: string, color?: keyof typeof colors): void {
    const colorCode = color ? colors[color] : ''
    const resetCode = color ? colors.reset : ''
    console.log(`${colorCode}${message}${resetCode}`)
  }

  private async checkCommand(command: string): Promise<boolean> {
    try {
      execSync(`which ${command}`, { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  private async checkHerokuAuth(): Promise<boolean> {
    try {
      execSync('heroku auth:whoami', { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  private async getHerokuDatabaseUrl(): Promise<string> {
    try {
      const databaseUrl = execSync(
        `heroku config:get DATABASE_URL -a ${this.options.herokuAppName}`,
        { encoding: 'utf8' },
      ).trim()

      if (!databaseUrl) {
        throw new Error('DATABASE_URL is empty')
      }

      return databaseUrl
    } catch (error) {
      throw new Error(
        `Failed to get DATABASE_URL from Heroku app '${this.options.herokuAppName}': ${error}`,
      )
    }
  }

  private async createBackupDirectory(): Promise<void> {
    if (!existsSync(this.options.backupDir)) {
      mkdirSync(this.options.backupDir, { recursive: true })
    }
  }

  private async performBackup(
    databaseUrl: string,
    backupPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const pgDump = spawn('pg_dump', [
        databaseUrl,
        '--verbose',
        '--no-owner',
        '--no-acl',
        '-f',
        backupPath,
      ])

      let stderr = ''

      pgDump.stderr.on('data', (data) => {
        stderr += data.toString()
        // pg_dump writes verbose output to stderr, but it's not an error
        if (
          data.toString().includes('ERROR') ||
          data.toString().includes('FATAL')
        ) {
          process.stderr.write(data)
        }
      })

      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${stderr}`))
        }
      })

      pgDump.on('error', (error) => {
        reject(new Error(`Failed to spawn pg_dump: ${error.message}`))
      })
    })
  }

  private async compressBackup(backupPath: string): Promise<string> {
    const compressedPath = `${backupPath}.gz`

    await pipelineAsync(
      createReadStream(backupPath),
      createGzip(),
      createWriteStream(compressedPath),
    )

    return compressedPath
  }

  private async getFileSize(filePath: string): Promise<string> {
    try {
      const stats = await statAsync(filePath)
      const bytes = stats.size
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
    } catch {
      return 'Unknown'
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await readdirAsync(this.options.backupDir)
      const backupFiles = files.filter(
        (file) =>
          file.startsWith('bookedge_') &&
          (file.endsWith('.sql') || file.endsWith('.sql.gz')),
      )

      if (backupFiles.length <= this.options.keepBackups) {
        return
      }

      // Get file stats and sort by modification time (newest first)
      const fileStats = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = join(this.options.backupDir, file)
          const stats = await statAsync(filePath)
          return { file, mtime: stats.mtime, path: filePath }
        }),
      )

      fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

      // Remove old backups
      const filesToDelete = fileStats.slice(this.options.keepBackups)

      for (const fileInfo of filesToDelete) {
        await unlinkAsync(fileInfo.path)
      }

      if (filesToDelete.length > 0) {
        this.log(`Cleaned up ${filesToDelete.length} old backup(s)`, 'yellow')
      }
    } catch (error) {
      this.log(`Warning: Failed to cleanup old backups: ${error}`, 'yellow')
    }
  }

  private async showRecentBackups(): Promise<void> {
    try {
      const files = await readdirAsync(this.options.backupDir)
      const backupFiles = files.filter(
        (file) =>
          file.startsWith('bookedge_') &&
          (file.endsWith('.sql') || file.endsWith('.sql.gz')),
      )

      if (backupFiles.length === 0) {
        this.log('No backups found', 'yellow')
        return
      }

      // Get file stats and sort by modification time (newest first)
      const fileStats = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = join(this.options.backupDir, file)
          const stats = await statAsync(filePath)
          const size = await this.getFileSize(filePath)
          return {
            file,
            mtime: stats.mtime,
            size,
            path: filePath,
          }
        }),
      )

      fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

      this.log('\nRecent backups:', 'yellow')
      fileStats.slice(0, 5).forEach((fileInfo) => {
        const date = fileInfo.mtime.toLocaleString()
        console.log(`  ${fileInfo.file} (${fileInfo.size}) - ${date}`)
      })
    } catch (error) {
      this.log(`Warning: Failed to list recent backups: ${error}`, 'yellow')
    }
  }

  async run(): Promise<void> {
    try {
      this.log('Starting BookEdge database backup...', 'yellow')

      // Check prerequisites
      if (!(await this.checkCommand('heroku'))) {
        this.log(
          'Error: Heroku CLI is not installed. Please install it first.',
          'red',
        )
        this.log('Visit: https://devcenter.heroku.com/articles/heroku-cli')
        process.exit(1)
      }

      if (!(await this.checkCommand('pg_dump'))) {
        this.log('Error: PostgreSQL client tools are not installed.', 'red')
        this.log('Install with: brew install postgresql')
        process.exit(1)
      }

      if (!(await this.checkHerokuAuth())) {
        this.log(
          "Error: Not logged in to Heroku. Please run 'heroku login' first.",
          'red',
        )
        process.exit(1)
      }

      // Create backup directory
      await this.createBackupDirectory()

      // Get database URL
      this.log('Fetching database credentials from Heroku...', 'yellow')
      const databaseUrl = await this.getHerokuDatabaseUrl()

      // Perform backup
      this.log(`Creating backup to: ${BACKUP_PATH}`, 'yellow')
      await this.performBackup(databaseUrl, BACKUP_PATH)

      // Get file size
      const fileSize = await this.getFileSize(BACKUP_PATH)
      this.log('✓ Backup completed successfully!', 'green')
      this.log(`  File: ${BACKUP_PATH}`, 'green')
      this.log(`  Size: ${fileSize}`, 'green')

      // Create compressed version
      this.log('Creating compressed backup...', 'yellow')
      const compressedPath = await this.compressBackup(BACKUP_PATH)
      const compressedSize = await this.getFileSize(compressedPath)
      this.log(
        `✓ Compressed backup created: ${compressedPath} (${compressedSize})`,
        'green',
      )

      // Cleanup old backups
      this.log('Cleaning up old backups...', 'yellow')
      await this.cleanupOldBackups()

      this.log('✓ Backup process completed!', 'green')

      // Show recent backups
      await this.showRecentBackups()
    } catch (error) {
      this.log(`✗ Backup failed: ${error}`, 'red')
      process.exit(1)
    }
  }
}

// Main execution
if (require.main === module) {
  const backup = new HerokuDatabaseBackup({
    herokuAppName: HEROKU_APP_NAME,
    backupDir: BACKUP_DIR,
    keepBackups: 10,
  })

  backup.run().catch((error) => {
    console.error('Backup failed:', error)
    process.exit(1)
  })
}
