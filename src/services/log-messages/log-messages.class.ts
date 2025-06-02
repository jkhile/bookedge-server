import type { Params } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import { logger } from '../../logger'

export interface LogMessageData {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  source?: 'client' | 'server'
  metadata?: Record<string, unknown>
  timestamp?: string // Client timestamp in ISO format
}

export interface LogMessageParams extends Params {}

// Simple logging service that only uses Winston
export class LogMessageService {
  constructor(public options: { app: Application }) {}

  async create(data: LogMessageData): Promise<{ success: true; logged: 1 }> {
    // Handle single log message only (no batching needed for development)
    this.logToWinston(data)
    return { success: true, logged: 1 }
  }

  private logToWinston(data: LogMessageData): void {
    try {
      const { level, message, source, metadata, timestamp } = data
      const logMessage = `[${source || 'client'}] ${message}`

      // Create log entry with client timestamp at the root level
      const logEntry = {
        level,
        message: logMessage,
        timestamp: timestamp || new Date().toISOString(), // Use client time or fallback
        source,
        ...metadata, // Spread metadata at root level
      }

      // Use Winston's log method with the complete entry
      logger.log(logEntry)
    } catch (error) {
      // Don't let logging errors break the application
      console.error('Failed to log message to Winston:', error)
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
