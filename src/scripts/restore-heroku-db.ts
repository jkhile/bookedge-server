#!/usr/bin/env ts-node

import { execSync, spawn } from 'child_process'
import {
  existsSync,
  readdir,
  stat,
  createReadStream,
  createWriteStream,
} from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import { createGunzip } from 'zlib'
import { pipeline } from 'stream'
import { createInterface } from 'readline'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'

const readdirAsync = promisify(readdir)
const statAsync = promisify(stat)
const pipelineAsync = promisify(pipeline)

// Configuration
const HEROKU_APP_NAME = process.env.HEROKU_APP_NAME || 'bookedge'
const BACKUP_DIR = process.env.BACKUP_DIR || './backups'

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
}

interface RestoreOptions {
  herokuAppName: string
  backupDir: string
  backupFile: string
}

class HerokuDatabaseRestore {
  private options: RestoreOptions

  constructor(options: RestoreOptions) {
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

  private async showAvailableBackups(): Promise<void> {
    try {
      if (!existsSync(this.options.backupDir)) {
        this.log(
          `No backup directory found at ${this.options.backupDir}`,
          'yellow',
        )
        return
      }

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

      this.log('Available backups:', 'yellow')
      fileStats.slice(0, 5).forEach((fileInfo) => {
        const date = fileInfo.mtime.toLocaleString()
        console.log(`  ${fileInfo.file} (${fileInfo.size}) - ${date}`)
      })
    } catch (error) {
      this.log(`Warning: Failed to list available backups: ${error}`, 'yellow')
    }
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

  private async decompressFile(compressedPath: string): Promise<string> {
    const tempFileName = `restore_${randomBytes(8).toString('hex')}.sql`
    const tempPath = join(tmpdir(), tempFileName)

    await pipelineAsync(
      createReadStream(compressedPath),
      createGunzip(),
      createWriteStream(tempPath),
    )

    return tempPath
  }

  private async promptConfirmation(): Promise<boolean> {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    this.log(
      `⚠️  WARNING: This will completely replace the database on Heroku app '${this.options.herokuAppName}'`,
      'red',
    )
    this.log('   All existing data will be lost!', 'red')
    this.log(`Backup file: ${this.options.backupFile}`, 'yellow')
    console.log('')

    return new Promise((resolve) => {
      rl.question(
        "Are you sure you want to continue? (type 'yes' to confirm): ",
        (answer) => {
          rl.close()
          resolve(answer === 'yes')
        },
      )
    })
  }

  private async performRestore(
    databaseUrl: string,
    backupPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const psql = spawn('psql', [databaseUrl, '-f', backupPath, '--quiet'])

      let stderr = ''

      psql.stderr.on('data', (data) => {
        stderr += data.toString()
        process.stderr.write(data)
      })

      psql.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`psql failed with code ${code}: ${stderr}`))
        }
      })

      psql.on('error', (error) => {
        reject(new Error(`Failed to spawn psql: ${error.message}`))
      })
    })
  }

  private showUsage(): void {
    console.log('Usage: ts-node restore-heroku-db.ts <backup_file>')
    console.log(
      'Example: ts-node restore-heroku-db.ts backups/bookedge_20231201_143022.sql',
    )
    console.log(
      '         ts-node restore-heroku-db.ts backups/bookedge_20231201_143022.sql.gz',
    )
    console.log('')
  }

  async run(): Promise<void> {
    try {
      // Check if backup file is provided
      if (!this.options.backupFile) {
        this.log('Error: No backup file specified', 'red')
        this.showUsage()
        await this.showAvailableBackups()
        process.exit(1)
      }

      // Check if backup file exists
      if (!existsSync(this.options.backupFile)) {
        this.log(
          `Error: Backup file '${this.options.backupFile}' not found`,
          'red',
        )
        this.showUsage()
        await this.showAvailableBackups()
        process.exit(1)
      }

      // Check prerequisites
      if (!(await this.checkCommand('heroku'))) {
        this.log(
          'Error: Heroku CLI is not installed. Please install it first.',
          'red',
        )
        this.log('Visit: https://devcenter.heroku.com/articles/heroku-cli')
        process.exit(1)
      }

      if (!(await this.checkCommand('psql'))) {
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

      // Get confirmation
      const confirmed = await this.promptConfirmation()
      if (!confirmed) {
        this.log('Operation cancelled.', 'yellow')
        process.exit(0)
      }

      // Get database URL
      this.log('Fetching database credentials from Heroku...', 'yellow')
      const databaseUrl = await this.getHerokuDatabaseUrl()

      // Handle compressed files
      let backupPath = this.options.backupFile
      let tempFile: string | null = null

      if (this.options.backupFile.endsWith('.gz')) {
        this.log('Decompressing backup file...', 'yellow')
        tempFile = await this.decompressFile(this.options.backupFile)
        backupPath = tempFile
      }

      // Perform restore
      this.log('Restoring database from backup...', 'yellow')
      this.log(
        'This may take several minutes depending on the database size...',
        'yellow',
      )

      try {
        await this.performRestore(databaseUrl, backupPath)
        this.log('✓ Database restore completed successfully!', 'green')
      } finally {
        // Clean up temp file if it exists
        if (tempFile) {
          try {
            const { unlink } = await import('fs/promises')
            await unlink(tempFile)
          } catch (error) {
            this.log(`Warning: Failed to cleanup temp file: ${error}`, 'yellow')
          }
        }
      }

      this.log('✓ Restore process completed!', 'green')
    } catch (error) {
      this.log(`✗ Restore failed: ${error}`, 'red')
      process.exit(1)
    }
  }
}

// Main execution
if (require.main === module) {
  const backupFile = process.argv[2]

  const restore = new HerokuDatabaseRestore({
    herokuAppName: HEROKU_APP_NAME,
    backupDir: BACKUP_DIR,
    backupFile,
  })

  restore.run().catch((error) => {
    console.error('Restore failed:', error)
    process.exit(1)
  })
}
